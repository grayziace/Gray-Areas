/* Cloudflare Pages Function — fetch daily step count from Google Fit / Health */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: 'invalid_date', hint: 'Use ?date=YYYY-MM-DD' }, 400);
  }

  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_FIT_REFRESH_TOKEN,
  } = env;

  if (!GOOGLE_FIT_REFRESH_TOKEN || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return json({
      error: 'not_configured',
      hint: 'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_FIT_REFRESH_TOKEN in Cloudflare env vars.',
    }, 503);
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: GOOGLE_FIT_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return json({ error: 'auth_failed', detail: tokenData.error || 'no access token' }, 502);
    }

    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    const aggRes = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: start.getTime(),
        endTimeMillis: end.getTime(),
      }),
    });
    const aggData = await aggRes.json();
    if (!aggRes.ok) {
      return json({ error: 'fit_api_failed', detail: aggData.error?.message || aggRes.statusText }, 502);
    }

    let steps = 0;
    for (const bucket of aggData.bucket || []) {
      for (const dataset of bucket.dataset || []) {
        for (const point of dataset.point || []) {
          for (const val of point.value || []) {
            if (typeof val.intVal === 'number') steps += val.intVal;
          }
        }
      }
    }

    return json({ date, steps, source: 'google_fit' });
  } catch (err) {
    return json({ error: 'server_error', detail: String(err.message || err) }, 500);
  }
}
