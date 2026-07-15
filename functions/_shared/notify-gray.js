const ACTIVITY_LABELS = {
  card_created: 'New coder card created',
  card_updated: 'Coder card updated',
  quest_sent: 'Quest sent',
  quest_complete: 'Quest completed',
  quest_comment: 'Quest comment',
  quest_vote: 'Quest vote',
  xp_award: 'XP awarded',
  xp_request: 'XP request',
  community_post: 'Community post',
  community_reply: 'Community reply',
  inbox_message: 'Private message',
  coder_login: 'Coder logged in',
};

export function activityNotifyText(activity) {
  const label = ACTIVITY_LABELS[activity?.type] || activity?.type || 'Coder activity';
  return [
    `Gray Areas — ${label}`,
    activity?.name ? `Coder: ${activity.name}` : '',
    activity?.detail ? `Detail: ${activity.detail}` : '',
    activity?.amount ? `XP: ${activity.amount}` : '',
    `Time: ${activity?.at || new Date().toISOString()}`,
    'https://gray-areas.pages.dev/',
  ].filter(Boolean).join('\n');
}

export function activityNotifySubject(activity) {
  const label = ACTIVITY_LABELS[activity?.type] || activity?.type || 'Coder activity';
  return `[Gray Areas] ${label}${activity?.name ? ` — ${activity.name}` : ''}`;
}

async function sendResendEmail(env, subject, text) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM || 'Gray Areas <onboarding@resend.dev>',
      to: [env.GRAY_NOTIFY_EMAIL],
      subject,
      text,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Resend failed');
  }
  return true;
}

async function sendTwilioSms(env, text) {
  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_FROM_NUMBER;
  const to = env.GRAY_NOTIFY_PHONE;
  if (!sid || !token || !from || !to) return false;
  const body = new URLSearchParams({ To: to, From: from, Body: text.slice(0, 1500) });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Twilio failed');
  }
  return true;
}

export async function notifyGrayFromActivity(env, activity) {
  const email = env.GRAY_NOTIFY_EMAIL;
  const phone = env.GRAY_NOTIFY_PHONE;
  const hasEmail = email && env.RESEND_API_KEY;
  const hasSms = phone && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER;
  if (!hasEmail && !hasSms) return { skipped: true, reason: 'No notify credentials configured' };

  const subject = activityNotifySubject(activity);
  const text = activityNotifyText(activity);
  const result = { email: false, sms: false };

  if (hasEmail) {
    try {
      await sendResendEmail(env, subject, text);
      result.email = true;
    } catch (err) {
      console.error('notify email:', err);
      result.emailError = err.message;
    }
  }
  if (hasSms) {
    try {
      await sendTwilioSms(env, text);
      result.sms = true;
    } catch (err) {
      console.error('notify sms:', err);
      result.smsError = err.message;
    }
  }
  return result;
}
