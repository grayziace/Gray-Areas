/* ===== In-browser photo / video capture (getUserMedia) ===== */

const MediaCapture = {
  stream: null,
  recorder: null,
  chunks: [],
  mode: 'photo',
  onResult: null,
  maxVideoMs: 60000,

  init(){
    const back = document.getElementById('mediaCaptureBack');
    if(!back || back.dataset.bound) return;
    back.dataset.bound = '1';
    document.getElementById('closeMediaCapture')?.addEventListener('click', () => this.close());
    back.addEventListener('click', e => { if(e.target.id === 'mediaCaptureBack') this.close(); });
    document.getElementById('mcSnapPhoto')?.addEventListener('click', () => this.snapPhoto());
    document.getElementById('mcStartVideo')?.addEventListener('click', () => this.startVideo());
    document.getElementById('mcStopVideo')?.addEventListener('click', () => this.stopVideo());
    document.getElementById('mcSwitchCamera')?.addEventListener('click', () => this.switchCamera());
  },

  async open(opts = {}){
    this.init();
    this.mode = opts.mode || 'photo';
    this.onResult = opts.onResult || null;
    this.facingMode = opts.facingMode || 'user';
    const back = document.getElementById('mediaCaptureBack');
    const title = document.getElementById('mediaCaptureTitle');
    if(title) title.textContent = this.mode === 'video' ? 'Record video note' : 'Take photo note';
    document.getElementById('mcPhotoActions')?.classList.toggle('hidden', this.mode !== 'photo');
    document.getElementById('mcVideoActions')?.classList.toggle('hidden', this.mode !== 'video');
    document.getElementById('mcVideoStatus')?.classList.add('hidden');
    back?.classList.remove('hidden');
    document.body.classList.add('media-capture-open');
    try{
      await this.startCamera();
    }catch(err){
      alert('Camera not available — use upload instead, or allow camera permission (HTTPS required).');
      this.close();
    }
  },

  async startCamera(){
    this.stopTracks();
    const constraints = {
      video: { facingMode: this.facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: this.mode === 'video',
    };
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.getElementById('mcPreview');
    if(video){
      video.srcObject = this.stream;
      await video.play();
    }
  },

  async switchCamera(){
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    await this.startCamera();
  },

  stopTracks(){
    if(this.recorder && this.recorder.state !== 'inactive') try{ this.recorder.stop(); }catch(e){}
    this.recorder = null;
    this.chunks = [];
    if(this.stream){
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    const video = document.getElementById('mcPreview');
    if(video) video.srcObject = null;
  },

  snapPhoto(){
    const video = document.getElementById('mcPreview');
    const canvas = document.getElementById('mcCanvas');
    if(!video || !canvas || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    if(this.onResult) this.onResult({ type: 'photo', dataUrl });
    this.close();
  },

  startVideo(){
    if(!this.stream) return;
    this.chunks = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
    try{
      this.recorder = mime ? new MediaRecorder(this.stream, { mimeType: mime }) : new MediaRecorder(this.stream);
    }catch(e){
      alert('Video recording not supported on this browser.');
      return;
    }
    this.recorder.ondataavailable = e => { if(e.data?.size) this.chunks.push(e.data); };
    this.recorder.onstop = () => this.finishVideo();
    this.recorder.start(200);
    document.getElementById('mcStartVideo')?.classList.add('hidden');
    document.getElementById('mcStopVideo')?.classList.remove('hidden');
    const status = document.getElementById('mcVideoStatus');
    if(status){ status.classList.remove('hidden'); status.textContent = 'Recording…'; }
    this._videoTimer = setTimeout(() => this.stopVideo(), this.maxVideoMs);
  },

  stopVideo(){
    clearTimeout(this._videoTimer);
    if(this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    document.getElementById('mcStartVideo')?.classList.remove('hidden');
    document.getElementById('mcStopVideo')?.classList.add('hidden');
  },

  finishVideo(){
    const blob = new Blob(this.chunks, { type: this.chunks[0]?.type || 'video/webm' });
    const reader = new FileReader();
    reader.onload = () => {
      let dataUrl = reader.result;
      if(dataUrl.length > 4.2 * 1024 * 1024){
        alert('Clip too large for storage — try a shorter recording (max ~60s).');
        return;
      }
      if(this.onResult) this.onResult({ type: 'video', dataUrl, mime: blob.type });
      this.close();
    };
    reader.readAsDataURL(blob);
  },

  close(){
    this.stopTracks();
    document.getElementById('mediaCaptureBack')?.classList.add('hidden');
    document.body.classList.remove('media-capture-open');
  },
};
