/* ===== Auto-sync edits → GitHub (via Cloudflare Pages /api/sync-site) ===== */

(function(){
  const DEBOUNCE_MS = 4000;
  const SYNC_HASH_KEY = 'ga-sync-hash';
  const bootAt = Date.now();
  let timer = null;
  let inFlight = false;
  let pending = false;

  function setSyncStatus(text, kind){
    const el = document.getElementById('syncStatus');
    if(!el) return;
    el.textContent = text;
    el.className = 'sync-status' + (kind ? ` sync-status--${kind}` : '');
  }

  async function sha256(text){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function canAutoSync(){
    if(typeof isAdmin !== 'function' || !isAdmin()) return false;
    if(location.protocol === 'file:') return false;
    if(Date.now() - bootAt < 1500) return false;
    if(typeof buildContentJsFile !== 'function' || typeof buildSiteStateSource !== 'function') return false;
    return true;
  }

  window.queueGitSync = function queueGitSync(){
    if(!canAutoSync()) return;
    pending = true;
    setSyncStatus('Pending save…', 'pending');
    clearTimeout(timer);
    timer = setTimeout(flushGitSync, DEBOUNCE_MS);
  };

  async function flushGitSync(){
    if(!pending || inFlight || !canAutoSync()) return;

    try{
      const contentJs = await buildContentJsFile();
      const siteStateJs = buildSiteStateSource();
      const hash = await sha256(contentJs + '\n---\n' + siteStateJs);
      const last = sessionStorage.getItem(SYNC_HASH_KEY);
      if(hash === last){
        pending = false;
        setSyncStatus('Up to date', 'ok');
        return;
      }

      inFlight = true;
      setSyncStatus('Saving to git…', 'busy');

      const res = await fetch('/api/sync-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey: ADMIN_KEY,
          contentJs,
          siteStateJs,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      sessionStorage.setItem(SYNC_HASH_KEY, hash);
      pending = false;
      setSyncStatus(data.skipped ? 'Already saved' : 'Saved to git', 'ok');
      setTimeout(() => {
        if(!pending) setSyncStatus('', '');
      }, 3500);
    }catch(err){
      console.warn('Auto-sync failed:', err);
      pending = false;
      const msg = String(err.message || err);
      if(msg.includes('503') || msg.includes('GITHUB_TOKEN')){
        setSyncStatus('Sync not configured', 'err');
      }else if(msg.includes('404')){
        setSyncStatus('Sync only on Cloudflare URL', 'err');
      }else{
        setSyncStatus('Sync failed — use Export', 'err');
      }
    }finally{
      inFlight = false;
    }
  }
})();
