/* ===== Image generation — traditional anime · plain bg · cyberpunk accents ===== */

const CharGen = (function(){
  const NEGATIVE_BASE = 'blurry, low quality, watermark, text, logo, signature, deformed, ugly, bad anatomy, extra limbs, photorealistic, photograph, 3d render, busy background, detailed background, cityscape, scenery, complex background, multiple subjects, collage';

  const NEGATIVE_PORTRAIT = NEGATIVE_BASE + ', furry, anthropomorphic, anthro, kemono, fursona, animal ears, animal tail, cat girl, fox girl, beast person, humanoid animal';

  const NEGATIVE_ANIMAL = NEGATIVE_BASE + ', anthropomorphic, anthro, kemono, fursona, humanoid, bipedal, standing upright, human face, human body, person, human, clothes, wearing clothes, armor on animal';

  const PLAIN_BG = 'plain simple dark background, solid gradient background, minimal background, empty background, studio backdrop';

  const ANIME_PERSON = 'traditional anime art, clean cel shading, classic anime illustration style, single character portrait, cyberpunk neon rim lighting, subtle magenta and cyan accent lights';

  const ANIME_ANIMAL = 'traditional anime art, clean cel shading, classic anime illustration, cute accurate animal drawing, zoologically correct animal, natural animal anatomy, clearly recognizable species, cyberpunk neon accent glow on fur';

  const ANIMAL_WORDS = /\b(cat|kitten|dog|puppy|fox|owl|bird|raven|crow|wolf|tiger|lion|rabbit|bunny|hamster|mouse|rat|snake|dragon|fish|horse|deer|monkey|ape|bear|panda|animal|pet|stray|creature|spirit animal)\b/i;

  function hash(s){
    let h = 2166136261;
    for(let i = 0; i < s.length; i++){
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function resolveKind(kind, desc){
    if(kind === 'spirit' || kind === 'animal') return 'spirit';
    if(kind === 'portrait' && ANIMAL_WORDS.test(desc || '')) return 'spirit';
    return kind;
  }

  function buildPrompt(kind, desc){
    const d = (desc || '').trim();
    const resolved = resolveKind(kind, d);

    if(resolved === 'spirit'){
      const subject = d || 'cat';
      return [
        ANIME_ANIMAL,
        PLAIN_BG,
        `anime illustration of ${subject}`,
        'one animal only, centered, full animal visible',
        'looks exactly like the described animal species',
        'simple composition, no scenery',
      ].join(', ');
    }

    if(kind === 'place' || resolved === 'place'){
      const subject = d || 'neon city alley at night';
      return [
        'anime background art, cyberpunk city scene',
        subject,
        'wide shot, atmospheric neon',
      ].join(', ');
    }

    const subject = d || 'young person with short hair';
    return [
      ANIME_PERSON,
      PLAIN_BG,
      `anime portrait of human person: ${subject}`,
      'human face, human body, waist-up portrait',
      'one person only, centered',
    ].join(', ');
  }

  function negativeForKind(kind, desc){
    const resolved = resolveKind(kind, desc);
    if(resolved === 'spirit') return NEGATIVE_ANIMAL;
    if(resolved === 'portrait') return NEGATIVE_PORTRAIT;
    return NEGATIVE_BASE;
  }

  function sizeForKind(kind, desc){
    const resolved = resolveKind(kind, desc);
    if(resolved === 'spirit') return 512;
    if(kind === 'place') return 768;
    return 768;
  }

  function pollinationsUrl(prompt, w, h, seed, kind, desc){
    const s = seed ?? (hash(prompt) % 999999);
    const neg = negativeForKind(kind, desc);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${s}&nologo=true&enhance=false&negative=${encodeURIComponent(neg)}`;
  }

  async function fetchAsDataUrl(url, timeoutMs = 90000){
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try{
      const res = await fetch(url, { mode: 'cors', signal: ctrl.signal });
      if(!res.ok) throw new Error(`Image fetch failed (${res.status})`);
      const blob = await res.blob();
      if(!blob.type.startsWith('image/')) throw new Error('Invalid image response');
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }finally{
      clearTimeout(timer);
    }
  }

  async function generateImage(prompt, size, seed, kind, desc, overrideUrl){
    const url = overrideUrl || pollinationsUrl(prompt, size, size, seed, kind, desc);
    try{
      return await fetchAsDataUrl(url);
    }catch{
      return url;
    }
  }

  async function dataUrlToBlob(dataUrl){
    const res = await fetch(dataUrl);
    return res.blob();
  }

  async function resizeBlob(blob, maxDim = 768){
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if(Math.max(w, h) > maxDim){
          const s = maxDim / Math.max(w, h);
          w = Math.round(w * s);
          h = Math.round(h * s);
        }
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        c.toBlob(b => b ? resolve(b) : reject(new Error('Resize failed')), 'image/jpeg', 0.9);
      };
      img.onerror = () => reject(new Error('Could not read reference'));
      img.src = dataUrl;
    });
  }

  async function uploadCatbox(blob){
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('fileToUpload', blob, 'gray-areas-ref.jpg');
    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: fd });
    const text = (await res.text()).trim();
    if(!res.ok || !/^https?:\/\//i.test(text)) throw new Error(`Catbox upload failed (${res.status})`);
    return text;
  }

  async function upload0x0(blob){
    const fd = new FormData();
    fd.append('file', blob, 'gray-areas-ref.jpg');
    const res = await fetch('https://0x0.st', { method: 'POST', body: fd });
    const text = (await res.text()).trim();
    if(!res.ok || !/^https?:\/\//i.test(text)) throw new Error(`0x0 upload failed (${res.status})`);
    return text;
  }

  async function uploadReference(dataUrl){
    const blob = await resizeBlob(await dataUrlToBlob(dataUrl));
    const hosts = [uploadCatbox, upload0x0];
    let lastErr = null;
    for(const host of hosts){
      try{
        return await host(blob);
      }catch(err){
        lastErr = err;
        console.warn('Reference upload attempt failed:', err);
      }
    }
    throw lastErr || new Error('Could not upload reference image');
  }

  function buildStylizePrompt(kind, desc){
    const d = (desc || '').trim();
    const resolved = resolveKind(kind, d);

    if(resolved === 'spirit'){
      return [
        'transform this photo into traditional anime illustration',
        'same animal same pose same composition',
        'cyberpunk anime cel shading neon rim light',
        'plain dark background',
        d ? d : 'same species as photo',
      ].join(', ');
    }

    if(kind === 'place'){
      return [
        'transform this photo into anime cyberpunk illustration',
        'same place same composition',
        d || 'same scene',
      ].join(', ');
    }

    return [
      'transform this photo into traditional anime portrait',
      'same person same pose same face same hair',
      'cyberpunk anime cel shading neon rim light',
      'plain dark background',
      d || 'preserve likeness',
    ].join(', ');
  }

  function stylizeUrl(prompt, refUrl, kind, desc){
    const size = sizeForKind(kind, desc);
    const seed = hash(refUrl + prompt) % 999999;
    const params = new URLSearchParams({
      model: 'flux',
      image: refUrl,
      width: String(size),
      height: String(size),
      seed: String(seed),
      nologo: 'true',
      enhance: 'false',
      negative: negativeForKind(kind, desc),
    });
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
  }

  function localAnimeStylize(dataUrl){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const max = 768;
        if(Math.max(w, h) > max){
          const s = max / Math.max(w, h);
          w = Math.round(w * s);
          h = Math.round(h * s);
        }

        const chunk = document.createElement('canvas');
        const cw = Math.max(1, Math.round(w / 4));
        const ch = Math.max(1, Math.round(h / 4));
        chunk.width = cw;
        chunk.height = ch;
        chunk.getContext('2d').drawImage(img, 0, 0, cw, ch);

        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(chunk, 0, 0, w, h);

        const id = ctx.getImageData(0, 0, w, h);
        const d = id.data;
        const levels = 5;
        for(let i = 0; i < d.length; i += 4){
          d[i] = Math.round(d[i] / 255 * (levels - 1)) / (levels - 1) * 255;
          d[i + 1] = Math.round(d[i + 1] / 255 * (levels - 1)) / (levels - 1) * 255;
          d[i + 2] = Math.round(d[i + 2] / 255 * (levels - 1)) / (levels - 1) * 255;
        }
        ctx.putImageData(id, 0, 0);

        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = 'rgba(255, 79, 216, 0.2)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(58, 214, 224, 0.14)';
        ctx.fillRect(0, h * 0.4, w, h * 0.6);
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(155, 92, 255, 0.1)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(8, 4, 16, 0.06)';
        ctx.fillRect(0, 0, w, h);

        resolve(c.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => reject(new Error('Could not read reference'));
      img.src = dataUrl;
    });
  }

  async function stylizeFromReference(kind, desc, refDataUrl){
    const prompt = buildStylizePrompt(kind, desc);
    const resolved = resolveKind(kind, desc);
    const size = sizeForKind(kind, desc);

    try{
      const refUrl = await uploadReference(refDataUrl);
      const url = stylizeUrl(prompt, refUrl, kind, desc);
      return await fetchAsDataUrl(url, 120000);
    }catch(aiErr){
      console.warn('AI reference stylize failed, using local fallback:', aiErr);
      try{
        return await localAnimeStylize(refDataUrl);
      }catch(localErr){
        console.error('Local stylize failed:', localErr);
        throw aiErr;
      }
    }
  }

  async function generateStylized(kind, desc, refDataUrl){
    return stylizeFromReference(kind, desc, refDataUrl);
  }

  async function generate(kind, desc){
    const resolved = resolveKind(kind, desc);
    const size = sizeForKind(kind, desc);
    const prompt = buildPrompt(kind, desc);
    return generateImage(prompt, size, hash(prompt) % 999999, resolved, desc);
  }

  async function generatePortrait(desc){ return generate('portrait', desc); }
  async function generateSpirit(desc){ return generate('spirit', desc); }

  function previewUrl(desc, kind = 'portrait'){
    const size = sizeForKind(kind, desc);
    const prompt = buildPrompt(kind, desc);
    const resolved = resolveKind(kind, desc);
    return pollinationsUrl(prompt, size, size, null, resolved, desc);
  }

  return {
    generate,
    generatePortrait,
    generateSpirit,
    generateStylized,
    stylizeFromReference,
    localAnimeStylize,
    previewUrl,
    buildPrompt,
    buildStylizePrompt,
    resolveKind,
  };
})();
