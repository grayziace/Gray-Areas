/* Cloudflare Pages — append viewer quests / characters to visitor-data.json */

import { notifyGrayFromActivity } from '../_shared/notify-gray.js';

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

    let store = { viewerCharacters: [], quests: [], videoDiary: [], inboxMessages: [], xpRequests: [], coderActivityPulses: [], chatMessages: [], pressSubmissions: [], coderPresence: {}, friendRequests: [] };
    let sha = null;
    if (getRes.ok && fileMeta.content) {
      sha = fileMeta.sha;
      const raw = atob(fileMeta.content.replace(/\n/g, ''));
      store = JSON.parse(raw);
    } else if (getRes.status !== 404) {
      throw new Error(fileMeta.message || 'Could not read visitor-data.json');
    }

    let notifyActivity = null;

    if (action === 'createCharacter') {
      store.viewerCharacters = store.viewerCharacters || [];
      const idx = store.viewerCharacters.findIndex(c => c.id === payload.id);
      const record = {
        ...payload,
        isCoderCard: true,
        active: true,
        status: 'active',
        updatedAt: new Date().toISOString(),
      };
      if (idx >= 0) store.viewerCharacters[idx] = { ...store.viewerCharacters[idx], ...record };
      else store.viewerCharacters.push(record);

      store.coderActivityPulses = store.coderActivityPulses || [];
      const pulse = {
        id: `act-create-${payload.id}`,
        at: new Date().toISOString(),
        type: 'card_created',
        coderId: payload.id,
        name: payload.name || 'Coder',
        detail: `${payload.name || 'Coder'} created their Coders Card`,
      };
      if (!store.coderActivityPulses.some(a => a.id === pulse.id)) {
        store.coderActivityPulses.unshift(pulse);
        store.coderActivityPulses = store.coderActivityPulses.slice(0, 200);
      }
      notifyActivity = pulse;
    } else if (action === 'updateCharacter') {
      store.viewerCharacters = store.viewerCharacters || [];
      const idx = store.viewerCharacters.findIndex(c => c.id === payload.id);
      if (idx >= 0) store.viewerCharacters[idx] = { ...store.viewerCharacters[idx], ...payload };
      else store.viewerCharacters.push(payload);
    } else if (action === 'submitQuest') {
      store.quests = store.quests || [];
      store.quests.push(payload);
    } else if (action === 'updateQuest') {
      store.quests = store.quests || [];
      const idx = store.quests.findIndex(q => q.id === payload.id);
      if (idx >= 0) store.quests[idx] = { ...store.quests[idx], ...payload };
      else store.quests.push(payload);
    } else if (action === 'deleteCharacter') {
      const id = payload.id;
      store.viewerCharacters = (store.viewerCharacters || []).filter(c => c.id !== id);
      store.quests = (store.quests || []).filter(q => q.fromCharacterId !== id);
      store.inboxMessages = (store.inboxMessages || []).filter(m => m.fromId !== id && m.toId !== id);
      store.pressSubmissions = (store.pressSubmissions || []).filter(s => s.characterId !== id);
      store.coderRecommendations = (store.coderRecommendations || []).filter(r => r.coderId !== id);
      store.xpRequests = (store.xpRequests || []).filter(r => r.coderId !== id);
      store.chatMessages = (store.chatMessages || []).filter(m => m.characterId !== id);
      store.friendRequests = (store.friendRequests || []).filter(r => r.fromId !== id && r.toId !== id);
      store.coderActivityPulses = (store.coderActivityPulses || []).filter(a => a.coderId !== id);
      if (store.coderPresence) delete store.coderPresence[id];
      (store.viewerCharacters || []).forEach(c => {
        if (Array.isArray(c.collection?.friends)) {
          c.collection.friends = c.collection.friends.filter(fid => fid !== id);
        }
      });

      store.coderActivityPulses = store.coderActivityPulses || [];
      const pulse = {
        id: `act-delete-${id}`,
        at: new Date().toISOString(),
        type: 'account_deleted',
        coderId: id,
        name: payload.name || 'Coder',
        detail: payload.name ? `Account deleted: ${payload.name}` : `Account deleted (${id})`,
      };
      if (!store.coderActivityPulses.some(a => a.id === pulse.id)) {
        store.coderActivityPulses.unshift(pulse);
        store.coderActivityPulses = store.coderActivityPulses.slice(0, 200);
      }
      notifyActivity = pulse;
    } else if (action === 'pulseActivity') {
      store.coderActivityPulses = store.coderActivityPulses || [];
      const exists = store.coderActivityPulses.some(a => a.id === payload.id);
      if (!exists) {
        store.coderActivityPulses.unshift(payload);
        store.coderActivityPulses = store.coderActivityPulses.slice(0, 200);
      }
      notifyActivity = payload;
    } else if (action === 'heartbeat') {
      store.coderPresence = store.coderPresence || {};
      if (payload.coderId && payload.at) {
        store.coderPresence[payload.coderId] = {
          at: payload.at,
          name: payload.name || '',
        };
      }
    } else if (action === 'postChatMessage') {
      store.chatMessages = store.chatMessages || [];
      const exists = store.chatMessages.some(m => m.id === payload.id);
      if (!exists) {
        store.chatMessages.push(payload);
        store.chatMessages = store.chatMessages.slice(-400);
      }
    } else if (action === 'submitPressSubmission') {
      store.pressSubmissions = store.pressSubmissions || [];
      const exists = store.pressSubmissions.some(s => s.id === payload.id);
      if (!exists) store.pressSubmissions.unshift(payload);
    } else if (action === 'submitRecommendation') {
      store.coderRecommendations = store.coderRecommendations || [];
      const exists = store.coderRecommendations.some(r => r.id === payload.id);
      if (!exists) store.coderRecommendations.unshift(payload);
      store.coderRecommendations = store.coderRecommendations.slice(0, 120);
    } else if (action === 'updatePressSubmission') {
      store.pressSubmissions = store.pressSubmissions || [];
      const idx = store.pressSubmissions.findIndex(s => s.id === payload.id);
      if (idx >= 0) store.pressSubmissions[idx] = { ...store.pressSubmissions[idx], ...payload };
      else store.pressSubmissions.unshift(payload);
    } else if (action === 'sendMessage') {
      store.inboxMessages = store.inboxMessages || [];
      store.inboxMessages.unshift(payload);
      store.inboxMessages = store.inboxMessages.slice(0, 500);
    } else if (action === 'markMessagesRead') {
      store.inboxMessages = store.inboxMessages || [];
      const ids = Array.isArray(payload.ids) ? payload.ids : [];
      const readerId = payload.readerId;
      store.inboxMessages = store.inboxMessages.map(m => {
        if (!ids.includes(m.id) || !readerId) return m;
        const readBy = Array.isArray(m.readBy) ? [...m.readBy] : [];
        if (!readBy.includes(readerId)) readBy.push(readerId);
        return { ...m, readBy };
      });
    } else if (action === 'submitXpRequest') {
      store.xpRequests = store.xpRequests || [];
      const exists = store.xpRequests.some(r => r.id === payload.id);
      if (!exists) store.xpRequests.unshift(payload);
    } else if (action === 'resolveXpRequest') {
      store.xpRequests = store.xpRequests || [];
      const idx = store.xpRequests.findIndex(r => r.id === payload.id);
      if (idx >= 0) store.xpRequests[idx] = { ...store.xpRequests[idx], ...payload };
    } else if (action === 'sendFriendRequest') {
      store.friendRequests = store.friendRequests || [];
      const dup = store.friendRequests.some(r =>
        r.status === 'pending' && r.fromId === payload.fromId && r.toId === payload.toId,
      );
      if (!dup) store.friendRequests.unshift(payload);
      store.friendRequests = store.friendRequests.slice(0, 200);
    } else if (action === 'respondFriendRequest') {
      store.friendRequests = store.friendRequests || [];
      const idx = store.friendRequests.findIndex(r => r.id === payload.id);
      if (idx >= 0) store.friendRequests[idx] = { ...store.friendRequests[idx], ...payload };
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

    if (notifyActivity) {
      try { await notifyGrayFromActivity(env, notifyActivity); } catch (err) { console.error('visitor-submit notify:', err); }
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('visitor-submit:', err);
    return jsonResponse({ error: err.message || 'Submit failed' }, 500);
  }
}
