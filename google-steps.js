/* ===== Google Fit / Health step sync (client) ===== */

const GoogleSteps = {
  async syncForDate(dateKey, opts = {}){
    const key = dateKey || (typeof todayKey === 'function' ? todayKey() : '');
    const btn = opts.button;
    const input = opts.input || document.getElementById('logSteps');
    const statusEl = opts.statusEl || document.getElementById('stepsSyncStatus');
    if(btn){
      btn.disabled = true;
      btn.dataset.oldText = btn.textContent;
      btn.textContent = 'Syncing…';
    }
    if(statusEl) statusEl.textContent = 'Contacting Google Fit…';
    try{
      const res = await fetch(`/api/google-fit-steps?date=${encodeURIComponent(key)}`);
      const data = await res.json();
      if(!res.ok){
        const msg = data.hint || data.detail || data.error || 'Sync failed';
        if(statusEl) statusEl.textContent = msg;
        if(data.error === 'not_configured') alert('Google Fit not configured yet.\n\nAdd GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_FIT_REFRESH_TOKEN to your Cloudflare Pages environment variables.');
        else alert(msg);
        return null;
      }
      if(input) input.value = data.steps;
      if(statusEl) statusEl.textContent = `Synced ${data.steps.toLocaleString()} steps from Google Fit`;
      if(opts.autoSave && typeof DailyLog !== 'undefined' && DailyLog.currentKey?.() === key){
        DailyLog.save?.();
      }
      return data.steps;
    }catch(err){
      if(statusEl) statusEl.textContent = 'Sync failed — check connection';
      console.error('Google steps sync:', err);
      return null;
    }finally{
      if(btn){
        btn.disabled = false;
        btn.textContent = btn.dataset.oldText || 'Sync Google Health';
      }
    }
  },

  init(){
    document.getElementById('syncGoogleSteps')?.addEventListener('click', () => {
      const key = document.getElementById('logDateKey')?.value || (typeof todayKey === 'function' ? todayKey() : '');
      this.syncForDate(key, { input: document.getElementById('logSteps'), autoSave: false });
    });
    document.getElementById('syncLiveSteps')?.addEventListener('click', () => {
      this.syncForDate(typeof todayKey === 'function' ? todayKey() : '', {
        input: document.getElementById('logSteps'),
        statusEl: document.getElementById('liveStepsSyncStatus'),
        autoSave: true,
      });
    });
  },
};
