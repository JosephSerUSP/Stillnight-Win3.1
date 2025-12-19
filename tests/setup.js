// Mock Browser Environment
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
};

global.window = {
    location: { search: '' },
    AudioContext: class {
        createGain() {
            return {
                gain: {
                    value: 0,
                    setTargetAtTime: () => {}
                },
                connect: () => {}
            };
        }
        createOscillator() { return { start: () => {}, stop: () => {}, connect: () => {}, type: '', frequency: { value: 0 } }; }
        createBufferSource() { return { start: () => {}, stop: () => {}, connect: () => {}, playbackRate: { value: 1 }, onended: null }; }
        decodeAudioData() { return Promise.resolve({}); }
        get state() { return 'running'; }
        resume() { return Promise.resolve(); }
        get currentTime() { return 0; }
    },
    webkitAudioContext: class {},
};

global.document = {
    getElementById: () => null,
};
