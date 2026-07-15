/* Cloudflare Pages — append viewer quests / characters to visitor-data.json */

async function githubRequest(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'gray-areas-visitor/1.0',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { message: text || res.statusText }; }
  return { res, data };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function toBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true }, 204);
}

export async function onRequestPost(context) {
  const { env, request } = context;
  if (!env.GITHUB_TOKEN) {
    return jsonResponse({ error: 'Server not configured' }, 503);
  }

  let body;
  try { body = await request.json(); } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const expectedKey = env.VISITOR_WRITE_KEY || 'gray-areas-visitor';
  if (body.visitorKey !== expectedKey) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const action = body.action;
  const payload = body.data;
  if (!action || !payload || typeof payload !== 'object') {
    return jsonResponse({ error: 'Missing action or data' }, 400);
  }

  const repo = env.GITHUB_REPO || 'grayziace/Gray-Areas';
  const branch = env.GITHUB_BRANCH || 'main';
  const [owner, repoName] = repo.split('/');
  const path = 'visitor-data.json';

  try {
    const { res: getRes, data: fileMeta } = await githubRequest(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${path}?ref=${branch}`,
      env.GITHUB_TOKEN,
    );

    let store = { viewerCharacters: [], quests: [], videoDiary: [] };
    let sha = null;
    if (getRes.ok && fileMeta.content) {
      sha = fileMeta.sha;
      const raw = atob(fileMeta.content.replace(/\n/g, ''));
      store = JSON.parse(raw);
    } else if (getRes.status !== 404) {
      throw new Error(fileMeta.message || 'Could not read visitor-data.json');
    }

    if (action === 'createCharacter') {
      const exists = (store.viewerCharacters || []).some(c => c.id === payload.id);
      if (!exists) {
        store.viewerCharacters = store.viewerCharacters || [];
        store.viewerCharacters.push(payload);
      }
    } else if (action === 'submitQuest') {
      store.quests = store.quests || [];
      store.quests.push(payload);
    } else {
      return jsonResponse({ error: 'Unknown action' }, 400);
    }

    const content = JSON.stringify(store, null, 2);
    const { res: putRes, data: putData } = await githubRequest(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`,
      env.GITHUB_TOKEN,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Visitor ${action}: ${payload.title || payload.name || payload.id}`,
          content: toBase64Utf8(content),
          branch,
          ...(sha ? { sha } : {}),
        }),
      },
    );

    if (!putRes.ok) throw new Error(putData.message || 'GitHub write failed');
    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('visitor-submit:', err);
    return jsonResponse({ error: err.message || 'Submit failed' }, 500);
  }
}
