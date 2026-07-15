/* Cloudflare Pages Function — commits content.js + site-state.js to GitHub */

async function githubRequest(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'gray-areas-sync/1.0',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text || res.statusText };
  }
  return { res, data };
}

async function commitFiles(env, files, message, attempt = 0) {
  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO || 'grayziace/Gray-Areas';
  const branch = env.GITHUB_BRANCH || 'main';
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) throw new Error('Invalid GITHUB_REPO');

  const { res: refRes, data: refData } = await githubRequest(
    `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${branch}`,
    token,
  );
  if (!refRes.ok) throw new Error(refData.message || 'Could not read branch');

  const commitSha = refData.object.sha;

  const { res: commitRes, data: commitData } = await githubRequest(
    `https://api.github.com/repos/${owner}/${repoName}/git/commits/${commitSha}`,
    token,
  );
  if (!commitRes.ok) throw new Error(commitData.message || 'Could not read commit');

  const treeItems = [];
  for (const file of files) {
    const { res: blobRes, data: blobData } = await githubRequest(
      `https://api.github.com/repos/${owner}/${repoName}/git/blobs`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: file.content, encoding: 'utf-8' }),
      },
    );
    if (!blobRes.ok) throw new Error(blobData.message || `Blob failed for ${file.path}`);
    treeItems.push({ path: file.path, mode: '100644', type: 'blob', sha: blobData.sha });
  }

  const { res: treeRes, data: treeData } = await githubRequest(
    `https://api.github.com/repos/${owner}/${repoName}/git/trees`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base_tree: commitData.tree.sha, tree: treeItems }),
    },
  );
  if (!treeRes.ok) throw new Error(treeData.message || 'Tree create failed');

  if (treeData.sha === commitData.tree.sha) {
    return { skipped: true, sha: commitSha };
  }

  const { res: newCommitRes, data: newCommitData } = await githubRequest(
    `https://api.github.com/repos/${owner}/${repoName}/git/commits`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: [commitSha],
      }),
    },
  );
  if (!newCommitRes.ok) throw new Error(newCommitData.message || 'Commit failed');

  const { res: updateRes, data: updateData } = await githubRequest(
    `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branch}`,
    token,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: newCommitData.sha }),
    },
  );
  if (!updateRes.ok) {
    if (updateRes.status === 409 && attempt < 2) {
      return commitFiles(env, files, message, attempt + 1);
    }
    throw new Error(updateData.message || 'Ref update failed');
  }

  return { skipped: false, sha: newCommitData.sha };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function validatePayload(body) {
  if (!body || typeof body !== 'object') return 'Invalid JSON body';
  if (!body.adminKey || typeof body.adminKey !== 'string') return 'Missing adminKey';
  if (!body.contentJs || typeof body.contentJs !== 'string') return 'Missing contentJs';
  if (!body.siteStateJs || typeof body.siteStateJs !== 'string') return 'Missing siteStateJs';
  if (body.contentJs.length > 8_000_000 || body.siteStateJs.length > 8_000_000) {
    return 'Payload too large';
  }
  if (!body.contentJs.includes('const CONTENT = ')) return 'contentJs format invalid';
  if (!body.siteStateJs.includes('const SITE_STATE = ')) return 'siteStateJs format invalid';
  return null;
}

export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.GITHUB_TOKEN) {
    return jsonResponse({ error: 'Server not configured (GITHUB_TOKEN missing)' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const expectedKey = env.SYNC_ADMIN_KEY || 'gray-shenzhen-2026';
  if (body.adminKey !== expectedKey) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const validationError = validatePayload(body);
  if (validationError) return jsonResponse({ error: validationError }, 400);

  try {
    const result = await commitFiles(
      env,
      [
        { path: 'content.js', content: body.contentJs },
        { path: 'site-state.js', content: body.siteStateJs },
      ],
      'Auto-sync site edits from Gray Areas admin',
    );
    return jsonResponse({ ok: true, ...result });
  } catch (err) {
    console.error('sync-site:', err);
    return jsonResponse({ error: err.message || 'GitHub commit failed' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
