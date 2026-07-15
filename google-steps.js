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
      const data = await res.json().catch(() => ({}));
      if(!res.ok){
        const msg = data.hint || data.detail || data.error || 'Sync failed';
        if(statusEl) statusEl.textContent = msg;
        if(data.error === 'not_configured'){
          alert('Google Fit not configured yet.\n\nAdd GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_FIT_REFRESH_TOKEN to Cloudflare Pages environment variables.\n\nUntil then, enter steps manually.');
        } else alert(msg);
        return null;
      }
      const steps = data.steps;
      if(input) input.value = steps;
      if(typeof ensureTodayStream === 'function') ensureTodayStream();
      if(!state.entries[key]) state.entries[key] = {};
      state.entries[key].steps = steps;
      saveState();
      if(typeof LiveSync !== 'undefined') LiveSync.stepsSynced(steps);
      if(statusEl) statusEl.textContent = `Synced ${Number(steps).toLocaleString()} steps`;
      if(typeof renderHomeCheckIn === 'function') renderHomeCheckIn();
      if(opts.autoSave && typeof DailyLog !== 'undefined' && DailyLog.currentKey?.() === key) DailyLog.save?.();
      return steps;
    }catch(err){
      if(statusEl) statusEl.textContent = 'Sync failed — check connection';
      console.error('Google steps sync:', err);
      alert('Could not reach Google Fit API. Check deploy URL and Cloudflare function.');
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
      this.syncForDate(key, { input: document.getElementById('logSteps'), statusEl: document.getElementById('stepsSyncStatus') });
    });
  },
};
