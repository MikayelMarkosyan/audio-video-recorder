import {AudioRecordingService} from "../../services/audio-recording.service.js";

export class AudioRecordingControl extends HTMLElement {
    constructor() {
        super();
        this._isRecording = false;
        this._isPlaying = false;
        this._audioService = new AudioRecordingService();
    }

    connectedCallback() {
        this._render();
        this._initializeElementsAndEventListeners();
    }


    _render() {
        this.innerHTML = `
           <link rel="stylesheet" href="./components/audio-recorder/audio-recorder.component.css">
           <div class="controls">
               <button id="toggleRecording">Start Recording</button>
                 <div>
                    <label for="volumeControl">Microphone Volume</label>
                  <input type="range" id="volumeControl" min="0" max="1" value="0.01" step="0.01">
                   </div>
                  <button id="playStopButton">Play</button>
        </div>
      `
    }

    _initializeElementsAndEventListeners() {
        this.toggleRecordingButton = this.querySelector('#toggleRecording');
        this.volumeControl = this.querySelector('#volumeControl');
        this.playStopButton = this.querySelector('#playStopButton');
        this.toggleRecordingButton.addEventListener('click', () => this.toggleRecording());
        this.volumeControl.addEventListener('input', () => this.changeVolume());
        this.playStopButton.addEventListener('click', () => this.togglePlayStop());
    }

    async toggleRecording() {
        if (!this._isRecording) {
            this._isRecording = true;
            this.toggleRecordingButton.textContent = 'Stop Recording';
            this.playStopButton.disabled =  true;
            await this._audioService.startRecording(this.volumeControl.value);
        } else {
            this._isRecording = false;
            this.toggleRecordingButton.textContent = 'Start Recording';
            this.playStopButton.disabled =  false;
            await this._audioService.stopRecording();
        }

    }

    async togglePlayStop() {
        if (!this._isPlaying) {
            this._isPlaying = true;
            await this._audioService.play();
            this.playStopButton.textContent = 'Stop';
        } else {
            this._isPlaying = false;
            this._audioService.stop();
            this.playStopButton.textContent = 'Play';
        }
    }

    changeVolume() {
        const volume = this.volumeControl.value;
        this._audioService.changeVolume(parseFloat(volume));
    }
}

customElements.define('audio-recording-control', AudioRecordingControl);
