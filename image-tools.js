/* ===== Unified image block: describe · stylize · upload as-is ===== */

const ImageTools = (function(){
  const refStore = new Map();

  function applyCyberpunkGrade(dataUrl){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = 'rgba(255, 79, 216, 0.14)';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = 'rgba(58, 214, 224, 0.1)';
        ctx.fillRect(0, c.height * 0.45, c.width, c.height * 0.55);
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(155, 92, 255, 0.06)';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(8, 4, 16, 0.08)';
        ctx.fillRect(0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => reject(new Error('Could not read image'));
      img.src = dataUrl;
    });
  }

  function cropToAspect(dataUrl, aspectW, aspectH, focusX = 50, focusY = 50, outW = 640){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const targetAR = aspectW / aspectH;
        const srcAR = img.width / img.height;
        let sw, sh;
        if(srcAR > targetAR){
          sh = img.height;
          sw = sh * targetAR;
        }else{
          sw = img.width;
          sh = sw / targetAR;
        }
        const fx = Math.max(0, Math.min(100, Number(focusX) || 50)) / 100;
        const fy = Math.max(0, Math.min(100, Number(focusY) || 50)) / 100;
        const sx = Math.max(0, Math.min(img.width - sw, (img.width - sw) * fx));
        const sy = Math.max(0, Math.min(img.height - sh, (img.height - sh) * fy));
        const outH = Math.round(outW * aspectH / aspectW);
        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => reject(new Error('Could not read image'));
      img.src = dataUrl;
    });
  }

  async function maybeCrop(url, opts){
    if(!url || !opts.cropAspect || opts.skipCrop) return url;
    const [w, h] = opts.cropAspect;
    const focus = readFocusValues(opts.prefix);
    try{
      return await cropToAspect(url, w, h, focus.x, focus.y);
    }catch{
      return url;
    }
  }

  function readFocusValues(prefix){
    const xRange = document.getElementById(`${prefix}_focus_x_range`);
    const yRange = document.getElementById(`${prefix}_focus_y_range`);
    const x = Number(xRange?.value ?? document.getElementById(`${prefix}_focus_x`)?.value);
    const y = Number(yRange?.value ?? document.getElementById(`${prefix}_focus_y`)?.value);
    return { x: Number.isFinite(x) ? x : 50, y: Number.isFinite(y) ? y : 50 };
  }

  function readFocus(prefix){
    return {
      imageFocusX: readFocusValues(prefix).x,
      imageFocusY: readFocusValues(prefix).y,
    };
  }

  function imageUrlFor(prefix, hiddenId){
    const hid = hiddenId || `${prefix}_value`;
    return document.getElementById(hid)?.value || '';
  }

  function applyObjectPosition(img, focus){
    if(!img) return;
    img.style.objectFit = 'cover';
    img.style.objectPosition = `${focus.x}% ${focus.y}%`;
  }

  function updateFramePreview(prefix, hiddenId, focus){
    const box = document.getElementById(`${prefix}_frame_box`);
    if(!box) return;
    const url = imageUrlFor(prefix, hiddenId);
    const fx = focus?.x ?? readFocusValues(prefix).x;
    const fy = focus?.y ?? readFocusValues(prefix).y;
    if(!url){
      box.innerHTML = '';
      return;
    }
    let img = box.querySelector('img');
    if(!img){
      img = document.createElement('img');
      img.alt = '';
      box.innerHTML = '';
      box.appendChild(img);
    }
    if(img.src !== url) img.src = url;
    applyObjectPosition(img, { x: fx, y: fy });
  }

  function setFramingVisible(prefix, show){
    document.getElementById(`${prefix}_framing`)?.classList.toggle('hidden', !show);
  }

  function wireFraming(prefix, hiddenId, initialFocus){
    const fx = initialFocus?.x ?? 50;
    const fy = initialFocus?.y ?? 50;
    const xHidden = document.getElementById(`${prefix}_focus_x`);
    const yHidden = document.getElementById(`${prefix}_focus_y`);
    const xRange = document.getElementById(`${prefix}_focus_x_range`);
    const yRange = document.getElementById(`${prefix}_focus_y_range`);
    const framing = document.getElementById(`${prefix}_framing`);

    if(xHidden) xHidden.value = fx;
    if(yHidden) yHidden.value = fy;
    if(xRange) xRange.value = fx;
    if(yRange) yRange.value = fy;

    const sync = () => {
      const focus = readFocusValues(prefix);
      if(xHidden) xHidden.value = focus.x;
      if(yHidden) yHidden.value = focus.y;
      if(xRange && xRange.value !== String(focus.x)) xRange.value = focus.x;
      if(yRange && yRange.value !== String(focus.y)) yRange.value = focus.y;

      const previewImg = document.querySelector(`#${prefix}_preview img`);
      applyObjectPosition(previewImg, focus);
      updateFramePreview(prefix, hiddenId, focus);
    };

    if(framing?.dataset.framingWired !== '1'){
      framing.dataset.framingWired = '1';
      xRange?.addEventListener('input', sync);
      yRange?.addEventListener('input', sync);
    }

    setFramingVisible(prefix, !!imageUrlFor(prefix, hiddenId));
    sync();
  }

  function blockHtml(opts = {}){
    const p = opts.prefix || 'img';
    const label = opts.label || 'Image';
    const url = opts.currentUrl || '';
    const desc = opts.descValue || '';
    const placeholder = opts.descPlaceholder || 'Describe the look…';
    const hiddenId = opts.hiddenId || `${p}_value`;
    const focus = opts.initialFocus || { x: opts.imageFocusX ?? 50, y: opts.imageFocusY ?? 50 };
    const framing = opts.framing !== false;
    const e = typeof esc === 'function' ? esc : s => String(s ?? '');
    const pos = `${focus.x}% ${focus.y}%`;

    return `
    <div class="image-gen-block" data-img-prefix="${p}" data-img-hidden="${e(hiddenId)}">
      <div class="field"><label>${e(label)}</label></div>
      <div class="field">
        <label class="ig-sublabel">Describe</label>
        <textarea id="${p}_desc" rows="2" placeholder="${e(placeholder)}">${e(desc)}</textarea>
      </div>
      <div class="gen-actions">
        <button type="button" class="btn primary" data-ig="gen-text" data-prefix="${p}">Generate from description</button>
      </div>
      <div class="field ig-ref-field">
        <label class="ig-sublabel">Reference photo</label>
        <div class="gen-actions">
          <button type="button" class="btn" data-ig="pick-ref" data-prefix="${p}">Choose reference</button>
          <button type="button" class="btn" data-ig="gen-style" data-prefix="${p}" id="${p}_style_btn" disabled>Anime stylize reference</button>
        </div>
        <input type="file" id="${p}_ref" accept="image/*" class="ig-file-input">
        <div id="${p}_ref_preview" class="ig-ref-preview"></div>
      </div>
      <div class="gen-actions">
        <button type="button" class="btn" data-ig="pick-direct" data-prefix="${p}">Upload as-is</button>
        <input type="file" id="${p}_direct" accept="image/*" class="ig-file-input">
        <button type="button" class="btn admin-delete" data-ig="clear" data-prefix="${p}" id="${p}_clear"${url ? '' : ' disabled'}>Remove</button>
      </div>
      <p class="gen-note">Describe → generate from text · Reference → same photo in anime cyberpunk · Upload as-is → frame with sliders</p>
      <div id="${p}_preview" class="char-gen-preview">${url ? `<img src="${e(url)}" alt="" style="object-fit:cover;object-position:${pos};width:100%;max-height:220px">` : ''}</div>
      ${framing ? `
      <div class="ig-framing${url ? '' : ' hidden'}" id="${p}_framing">
        <label class="ig-sublabel">Frame in card — use sliders to reposition</label>
        <div class="ig-frame-preview card-photo-frame" id="${p}_frame_box">${url ? `<img src="${e(url)}" alt="" style="object-position:${pos}">` : ''}</div>
        <div class="ig-focus-sliders">
          <label class="ig-focus-row"><span>Left ↔ Right</span><input type="range" id="${p}_focus_x_range" min="0" max="100" value="${focus.x}"></label>
          <label class="ig-focus-row"><span>Up ↔ Down</span><input type="range" id="${p}_focus_y_range" min="0" max="100" value="${focus.y}"></label>
        </div>
      </div>` : ''}
      <input type="hidden" id="${hiddenId}" value="${e(url)}">
      <input type="hidden" id="${p}_focus_x" value="${focus.x}">
      <input type="hidden" id="${p}_focus_y" value="${focus.y}">
    </div>`;
  }

  function setPreview(prefix, url, focus, hiddenId){
    const fx = focus?.x ?? readFocusValues(prefix).x;
    const fy = focus?.y ?? readFocusValues(prefix).y;
    const prev = document.getElementById(`${prefix}_preview`);
    if(prev){
      prev.innerHTML = url
        ? `<img src="${url}" alt="" style="object-fit:cover;object-position:${fx}% ${fy}%;width:100%;max-height:220px">`
        : '';
    }
    const clearBtn = document.getElementById(`${prefix}_clear`);
    if(clearBtn) clearBtn.disabled = !url;
    setFramingVisible(prefix, !!url);
    updateFramePreview(prefix, hiddenId, { x: fx, y: fy });
  }

  function setRefPreview(prefix, url){
    const el = document.getElementById(`${prefix}_ref_preview`);
    if(!el) return;
    el.innerHTML = url ? `<img src="${url}" alt="" class="ig-ref-thumb"><span class="ig-ref-tag">Reference ready</span>` : '';
    const btn = document.getElementById(`${prefix}_style_btn`);
    if(btn) btn.disabled = !url;
  }

  function applyValue(opts, url){
    const hidden = document.getElementById(opts.hiddenId);
    if(hidden) hidden.value = url || '';
    (opts.mirrorIds || []).forEach(id => {
      const el = document.getElementById(id);
      if(el) el.value = url || '';
    });
    if(typeof opts.onChange === 'function') opts.onChange(url);
    setPreview(opts.prefix, url, null, opts.hiddenId);
    wireFraming(opts.prefix, opts.hiddenId, readFocusValues(opts.prefix));
  }

  function pickFile(input){
    if(!input) return;
    input.value = '';
    input.click();
  }

  function wire(opts = {}){
    const p = opts.prefix || 'img';
    const kind = opts.kind || 'portrait';
    const hiddenId = opts.hiddenId || `${p}_value`;
    const wireOpts = { ...opts, prefix: p, hiddenId, kind, skipCrop: opts.skipCrop ?? !!opts.cropAspect };

    refStore.delete(p);
    setRefPreview(p, '');

    const root = document.querySelector(`.image-gen-block[data-img-prefix="${p}"]`);
    if(!root) return;

    const initialUrl = document.getElementById(hiddenId)?.value || '';
    wireFraming(p, hiddenId, {
      x: opts.imageFocusX ?? opts.initialFocus?.x ?? 50,
      y: opts.imageFocusY ?? opts.initialFocus?.y ?? 50,
    });

    const refInput = document.getElementById(`${p}_ref`);
    const directInput = document.getElementById(`${p}_direct`);

    root.querySelector(`[data-ig="pick-ref"][data-prefix="${p}"]`)?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      pickFile(refInput);
    });

    root.querySelector(`[data-ig="pick-direct"][data-prefix="${p}"]`)?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      pickFile(directInput);
    });

    root.querySelector(`[data-ig="gen-text"][data-prefix="${p}"]`)?.addEventListener('click', async () => {
      const btn = root.querySelector(`[data-ig="gen-text"][data-prefix="${p}"]`);
      const desc = document.getElementById(`${p}_desc`)?.value?.trim() || '';
      btn.disabled = true;
      const old = btn.textContent;
      btn.textContent = 'Generating…';
      const prev = document.getElementById(`${p}_preview`);
      if(prev) prev.innerHTML = '<span class="gen-loading">Painting…</span>';
      try{
        let url = await CharGen.generate(kind, desc);
        url = await maybeCrop(url, wireOpts);
        applyValue(wireOpts, url);
      }catch{
        if(prev) prev.innerHTML = '<span class="gen-error">Failed — try upload instead.</span>';
      }finally{
        btn.disabled = false;
        btn.textContent = old;
      }
    });

    refInput?.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        refStore.set(p, reader.result);
        setRefPreview(p, reader.result);
      };
      reader.readAsDataURL(file);
    });

    root.querySelector(`[data-ig="gen-style"][data-prefix="${p}"]`)?.addEventListener('click', async () => {
      const ref = refStore.get(p);
      if(!ref){
        pickFile(refInput);
        return;
      }
      const btn = document.getElementById(`${p}_style_btn`);
      const desc = document.getElementById(`${p}_desc`)?.value?.trim() || '';
      btn.disabled = true;
      const old = btn.textContent;
      btn.textContent = 'Stylizing…';
      const prev = document.getElementById(`${p}_preview`);
      if(prev) prev.innerHTML = '<span class="gen-loading">Stylizing — can take up to a minute…</span>';
      try{
        const url = await CharGen.stylizeFromReference(kind, desc, ref);
        applyValue(wireOpts, await maybeCrop(url, wireOpts));
      }catch(err){
        console.error('Reference stylize failed:', err);
        if(prev) prev.innerHTML = '<span class="gen-error">Stylize failed — try Generate from description, or Upload as-is.</span>';
      }finally{
        btn.disabled = !refStore.get(p);
        btn.textContent = 'Anime stylize reference';
      }
    });

    directInput?.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        let url = reader.result;
        url = await maybeCrop(url, wireOpts);
        applyValue(wireOpts, url);
      };
      reader.readAsDataURL(file);
    });

    root.querySelector(`[data-ig="clear"][data-prefix="${p}"]`)?.addEventListener('click', () => {
      applyValue(wireOpts, '');
      refStore.delete(p);
      setRefPreview(p, '');
    });
  }

  return { blockHtml, wire, cropToAspect, readFocus, applyCyberpunkGrade };
})();
