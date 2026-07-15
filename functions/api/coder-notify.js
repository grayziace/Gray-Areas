import { notifyGrayFromActivity } from '../_shared/notify-gray.js';

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

export async function onRequestOptions() {
  return jsonResponse({ ok: true }, 204);
}

export async function onRequestPost(context) {
  const { env, request } = context;
  let body;
  try { body = await request.json(); } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const expectedKey = env.VISITOR_WRITE_KEY || 'gray-areas-visitor';
  if (body.visitorKey !== expectedKey) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const activity = body.activity;
  if (!activity || typeof activity !== 'object' || !activity.type) {
    return jsonResponse({ error: 'Missing activity' }, 400);
  }

  try {
    const result = await notifyGrayFromActivity(env, activity);
    return jsonResponse({ ok: true, ...result });
  } catch (err) {
    console.error('coder-notify:', err);
    return jsonResponse({ error: err.message || 'Notify failed' }, 500);
  }
}
