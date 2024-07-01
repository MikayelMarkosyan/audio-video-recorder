export  class VideoRecordingControl extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._isRecording = false;
        this._isPlaying = false;
        this._recordedChunks = [];
        this._stream = null;
        this._mediaRecorder = null;
        this._canvas = null;
        this._context = null;
        this._animationFrameId = null;
        this._images = [];

    }

    connectedCallback() {
        this._render();
        this._initializeElementsAndListeners();
    }

    _render() {
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./components/video-recorder/video-recorder.component.css">
            <div class="controls">
                <button id="recordButton">Start Recording</button>
                <button id="addImageButton">Add Image</button>
                <button id="playButton" disabled>Play</button>
                <input type="file" id="imageInput" style="display:none" />
            </div>
            <canvas id="canvas"></canvas>
        `;
    }

    _initializeElementsAndListeners() {
        this.recordButton = this.shadowRoot.querySelector('#recordButton');
        this.addImageButton = this.shadowRoot.querySelector('#addImageButton');
        this.playButton = this.shadowRoot.querySelector('#playButton');
        this.imageInput = this.shadowRoot.querySelector('#imageInput');
        this._canvas = this.shadowRoot.querySelector('#canvas');
        this._context = this._canvas.getContext('2d');

        this.recordButton.addEventListener('click', () => this.toggleRecording());
        this.addImageButton.addEventListener('click', () => this.imageInput.click());
        this.playButton.addEventListener('click', () => this.togglePlayback());
        this.imageInput.addEventListener('change', () => this.addImage());
    }

    async _getMediaStream() {
            return navigator.mediaDevices.getUserMedia({ video: true });
    }

    async toggleRecording() {
        if (!this._isRecording) {
            this._stream = await this._getMediaStream();
            const videoTracks = this._stream.getVideoTracks();
            this._mediaRecorder = new MediaRecorder(this._canvas.captureStream());
            this._mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this._recordedChunks.push(event.data);
                }
            };

            this._mediaRecorder.onstop = () => {
                const blob = new Blob(this._recordedChunks, { type: 'video/webm' });
                this.recordedVideoURL = URL.createObjectURL(blob);
                this.playButton.disabled = false;
            };

            this._recordedChunks = [];
            this._mediaRecorder.start();
            this.recordButton.textContent = 'Stop Recording';
            this._isRecording = true;
            this.drawToCanvas(videoTracks[0]);
        } else {
            this._mediaRecorder.stop();
            this._stream.getTracks().forEach(track => track.stop());
            this.recordButton.textContent = 'Start Recording';
            this._isRecording = false;
            cancelAnimationFrame(this._animationFrameId);
        }
    }

    drawToCanvas(videoTrack) {
        const imageCapture = new ImageCapture(videoTrack);
        const draw = async () => {
            if (this._isRecording) {
                const frame = await imageCapture.grabFrame();
                this._canvas.width = frame.width;
                this._canvas.height = frame.height;
                this._context.drawImage(frame, 0, 0);

                this._images.forEach(img => {
                    this._context.drawImage(img.image, img.x, img.y, img.width, img.height);
                });

                this._animationFrameId = requestAnimationFrame(draw);
            }
        };
        draw();
    }

    async addImage() {
        const file = this.imageInput.files[0];
        if (file) {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                // Store the image and its initial position/size
                this._images.push({
                    image: img,
                    x: 10,
                    y: 10,
                    width: 100,
                    height: 100
                });

                // Redraw the canvas to include the new image
                if (this._isRecording) {
                    this._context.drawImage(img, 10, 10, 100, 100);
                }
            };
        }
    }

    async togglePlayback() {
        if (!this._isPlaying) {
            this.playButton.textContent = 'Stop';
            this._isPlaying = true;
            this.playRecordedVideo();
        } else {
            this.playButton.textContent = 'Play';
            this._isPlaying = false;
            cancelAnimationFrame(this._animationFrameId);
        }
    }

    playRecordedVideo() {
        const video = document.createElement('video');
        video.src = this.recordedVideoURL;
        video.play();

        video.onplay = () => {
            const draw = () => {
                if (this._isPlaying && !video.paused && !video.ended) {
                    this._context.drawImage(video, 0, 0, this._canvas.width, this._canvas.height);
                    this._animationFrameId = requestAnimationFrame(draw);
                }
            };
            draw();
        };
    }
}

customElements.define('video-recording-control', VideoRecordingControl);
