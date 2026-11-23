"use strict";

(() => {
  const button = document.getElementById("music-toggle");
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return;

  const secondsPerBeat = 60 / 124;
  const tickLength = secondsPerBeat / 4;
  const chords = [
    [42, 54, 57, 61, 64],
    [38, 50, 54, 57, 61],
    [45, 57, 61, 64, 71],
    [40, 52, 56, 59, 66]
  ];
  const leadPattern = [0, 2, 3, 1, 2, 0, 3, 2];
  const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
  let context;
  let bus;
  let noise;
  let engine;
  let wanted = true;
  let playing = false;
  let wasUnlocked = false;
  let driveSound = { running: false };
  let timer;
  let step = 0;
  let playAt = 0;

  function initialize() {
    context = new AudioEngine();
    bus = context.createGain();
    bus.gain.value = 0;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.ratio.value = 4;
    bus.connect(limiter);
    limiter.connect(context.destination);
    engine = createEngine(limiter);
    context.addEventListener("statechange", synchronize);
    noise = context.createBuffer(1, Math.ceil(context.sampleRate * .35), context.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }

  function createEngine(destination) {
    const level = context.createGain();
    level.gain.value = 0;
    level.connect(destination);
    const lowpass = context.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 220;
    lowpass.Q.value = .77;
    lowpass.connect(level);
    const wave = context.createPeriodicWave(
      new Float32Array([0, .40, 1, .11, .55, .31, .15, .09]),
      new Float32Array(8)
    );
    const banks = [-1, 1].map(side => {
      const oscillator = context.createOscillator();
      oscillator.setPeriodicWave(wave);
      oscillator.frequency.value = 27;
      oscillator.detune.value = side * 12;
      oscillator.connect(lowpass);
      oscillator.start();
      return oscillator;
    });
    const sub = context.createOscillator();
    sub.type = "triangle";
    sub.frequency.value = 28;
    const subMix = context.createGain();
    subMix.gain.value = .26;
    sub.connect(subMix);
    subMix.connect(lowpass);
    sub.start();
    return {level, lowpass, banks, sub};
  }

  function updateEngine() {
    if (!engine) return;
    const {speed = 0, running, throttle, boost} = driveSound;
    const time = context.currentTime;
    const audible = playing && running;
    const shift = [38, 30, 20.5, 10.5, 0].find(point => speed >= point);
    const rpm = 810 + (shift ? 1210 : 0) + (speed - shift) * 315 + (throttle ? 330 : 0) + (boost ? 390 : 0);
    const firing = Math.min(rpm, 7000) / 30;
    for (const bank of engine.banks) bank.frequency.setTargetAtTime(firing, time, .075);
    engine.sub.frequency.setTargetAtTime(firing / 2, time, .085);
    engine.lowpass.frequency.setTargetAtTime(160 + speed * 8 + (throttle ? 170 : 0) + (boost ? 280 : 0), time, .10);
    engine.level.gain.setTargetAtTime(audible ? (throttle ? .092 : .043) + speed * .0011 : 0, time, .065);
    bus.gain.setTargetAtTime(playing ? (audible ? .24 : .31) : 0, time, .080);
  }

  function levelAt(time, volume, attack, length, destination = bus) {
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(.0001, time);
    envelope.gain.linearRampToValueAtTime(volume, time + attack);
    envelope.gain.exponentialRampToValueAtTime(.0001, time + length);
    envelope.connect(destination);
    return envelope;
  }

  function note(time, midi, length, volume, wave, attack = .014, lowPass = 0) {
    const oscillator = context.createOscillator();
    const gain = levelAt(time, volume, attack, length);
    oscillator.type = wave;
    oscillator.frequency.value = frequency(midi);
    if (lowPass) {
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(lowPass, time);
      filter.frequency.exponentialRampToValueAtTime(Math.max(80, lowPass * .42), time + length);
      oscillator.connect(filter);
      filter.connect(gain);
    } else {
      oscillator.connect(gain);
    }
    oscillator.start(time);
    oscillator.stop(time + length + .015);
  }

  function kick(time) {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(139, time);
    oscillator.frequency.exponentialRampToValueAtTime(47, time + .045);
    oscillator.frequency.exponentialRampToValueAtTime(43, time + .25);
    oscillator.connect(levelAt(time, .76, .003, .32));
    oscillator.start(time);
    oscillator.stop(time + .33);
  }

  function percussion(time, cutoff, duration, volume, filterType = "highpass") {
    const sample = context.createBufferSource();
    sample.buffer = noise;
    const filter = context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = cutoff;
    filter.Q.value = .72;
    sample.connect(filter);
    filter.connect(levelAt(time, volume, .004, duration));
    sample.start(time);
    sample.stop(time + duration + .01);
  }

  function sequence(time, tick) {
    const beatStep = tick % 4;
    const bar = Math.floor(tick / 16) % 8;
    const barStep = tick % 16;
    const chord = chords[bar % chords.length];
    if (beatStep === 0) kick(time);
    if (barStep === 4 || barStep === 12) {
      percussion(time, 1900, .085, .18, "bandpass");
      percussion(time + .013, 2200, .15, .13, "bandpass");
    }
    if (beatStep === 2) {
      percussion(time, 7500, .103, .135);
      note(time, chord[0], .19, .34, "triangle", .011, 320);
      note(time, chord[0] + 12, .14, .091, "sawtooth", .009, 580);
    }
    if (beatStep === 3 && bar >= 2) percussion(time + .009, 8800, .047, .053);
    if (barStep === 0) {
      for (const midi of chord.slice(1)) note(time + .06, midi, 1.65, .064, "triangle", .19, 1350);
    }
    if (barStep % 2 === 1 && (bar >= 2 || barStep <= 7)) {
      const midi = chord[leadPattern[Math.floor(barStep / 2)] + 1] + 12;
      note(time, midi, .31, .097, "triangle", .021);
      note(time + secondsPerBeat * .75, midi, .26, .027, "triangle", .021);
    }
    if (barStep === 14 && bar === 7) note(time, chord[0] + 7, .31, .25, "triangle", .014, 420);
  }

  function schedule() {
    if (!playing || context.state !== "running") return;
    if (playAt < context.currentTime) playAt = context.currentTime + .025;
    while (playAt < context.currentTime + .114) {
      sequence(playAt, step++);
      playAt += tickLength;
    }
  }

  function synchronize() {
    const canPlay = wanted && !document.hidden && context?.state === "running";
    if (canPlay && !playing) {
      playing = true;
      wasUnlocked = true;
      playAt = context.currentTime + .055;
      step = Math.ceil(step / 4) * 4;
      schedule();
      timer = setInterval(schedule, 30);
    } else if (!canPlay && playing) {
      playing = false;
      clearInterval(timer);
    }
    updateEngine();
    button.setAttribute("aria-pressed", String(playing));
    button.textContent = playing ? "Sound on" : wanted && !wasUnlocked ? "Enable sound" : "Sound off";
  }

  function unlock() {
    if (!wanted || document.hidden) return;
    try {
      if (!context) initialize();
      if (context.state !== "running") context.resume().then(synchronize, synchronize);
      synchronize();
    } catch {
      synchronize();
    }
  }

  button.hidden = false;
  button.addEventListener("click", () => {
    if (playing || !wanted) wanted = !playing;
    if (wanted) unlock();
    else synchronize();
  });
  function unlockOnInteraction(event) {
    if (event.target instanceof Node && button.contains(event.target)) return;
    if (!playing) unlock();
  }
  document.addEventListener("pointerdown", unlockOnInteraction, { passive: true });
  document.addEventListener("click", unlockOnInteraction);
  document.addEventListener("keydown", unlockOnInteraction);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) synchronize();
    else unlock();
  });
  document.getElementById("drive").addEventListener("night-shift:engine", event => {
    driveSound = event.detail;
    if (playing) updateEngine();
  });
  unlock();
})();
