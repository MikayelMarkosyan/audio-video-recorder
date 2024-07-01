/**
 * @class AudioRecordingService
 * @classdesc A service providing  audion recording and playback  functionality
 */
export class AudioRecordingService {

    static VOLUME_DEFAULT_VALUE = 0.2;

    constructor() {
        this._audioContext = null;
        this._mediaRecorder = null;
        this._audioChunks = [];
        this._gainNode = null;
        this._audioBuffer = null;
        this._audioSource = null;
        this._isPlaying = false;
        this._stream = null;
    }

    /**
     * Initializes the audio context, media stream, gain node, and media recorder.
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async _init() {
        if (!this._audioContext) {
            this._audioContext = new AudioContext();
        }
        this._stream = await navigator.mediaDevices.getUserMedia({audio: true});
        const source = this._audioContext.createMediaStreamSource(this._stream);
        this._gainNode = this._audioContext.createGain();
        this._gainNode.gain.value = AudioRecordingService.VOLUME_DEFAULT_VALUE;
        const destination = this._audioContext.createMediaStreamDestination();
        source.connect(this._gainNode);
        this._gainNode.connect(destination);
        this._mediaRecorder = new MediaRecorder(destination.stream);
        this._mediaRecorder.ondataavailable = event => {
            this._audioChunks.push(event.data);
        };
        this._mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(this._audioChunks, {type: 'audio/wav'});
            const arrayBuffer = await audioBlob.arrayBuffer();
            this._audioBuffer = await this._audioContext.decodeAudioData(arrayBuffer);
            this._stream.getTracks().forEach(track => track.stop());
        };

    }

    /**
     * Starts recording audio. Initializes the audio components if they haven't been initialized yet.
     * @async
     * @returns {Promise<void>}
     */
    async startRecording(volume) {
        await this._init();
        if (volume) {
            this._gainNode.gain.value = volume;
        }
        this._audioChunks = [];
        this._mediaRecorder.start();
    }

    /**
     * Stops recording audio. The recorded audio data is processed and stored in an AudioBuffer.
     */
    stopRecording() {
        if (this._mediaRecorder) {
            this._mediaRecorder.stop();
        }
    }

    /**
     * Adjusts the microphone volume to the specified value.
     * @param {number} value - The volume value, should be between 0 and 2.
     */
    changeVolume(value) {
        if (this._gainNode) {
            console.log(value);
            this._gainNode.gain.value = value;
        }
    }

    /**
     * Plays back the recorded audio. Creates an AudioBufferSourceNode from the stored AudioBuffer and starts playback.
     */
    play() {
        if (this._audioBuffer && !this._isPlaying) {
            this._audioSource = this._audioContext.createBufferSource();
            this._audioSource.buffer = this._audioBuffer;
            this._audioSource.connect(this._audioContext.destination);
            this._audioSource.start(0);
            this._isPlaying = true;
            this._audioSource.onended = () => {
                this._isPlaying = false;
            };
        }
    }

    /**
     * Stops the audio playback if it is currently playing.
     */
    stop() {
        if (this._audioSource) {
            this._audioSource.stop();
        }
    }
}
