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
  let enabled = false;
  let timer;
  let step = 0;
  let playAt = 0;
  let generation = 0;

  function initialize() {
    context = new AudioEngine();
    bus = context.createGain();
    bus.gain.value = 0;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.ratio.value = 4;
    bus.connect(limiter);
    limiter.connect(context.destination);
    noise = context.createBuffer(1, Math.ceil(context.sampleRate * .35), context.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
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
    if (!enabled || context.state !== "running") return;
    if (playAt < context.currentTime) playAt = context.currentTime + .025;
    while (playAt < context.currentTime + .114) {
      sequence(playAt, step++);
      playAt += tickLength;
    }
  }

  function display() {
    button.setAttribute("aria-pressed", String(enabled));
    button.textContent = enabled ? "Music on" : "Music off";
  }

  async function setEnabled(value) {
    const token = ++generation;
    enabled = value;
    clearInterval(timer);
    display();
    if (!value) {
      if (context) {
        bus.gain.cancelScheduledValues(context.currentTime);
        bus.gain.setTargetAtTime(0, context.currentTime, .036);
      }
      return;
    }
    try {
      if (!context) initialize();
      await context.resume();
      if (token !== generation) return;
      bus.gain.cancelScheduledValues(context.currentTime);
      bus.gain.setTargetAtTime(.31, context.currentTime, .056);
      playAt = context.currentTime + .055;
      step = Math.ceil(step / 4) * 4;
      schedule();
      timer = setInterval(schedule, 30);
    } catch {
      if (token !== generation) return;
      enabled = false;
      display();
    }
  }

  button.hidden = false;
  button.addEventListener("click", () => setEnabled(!enabled));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && enabled) setEnabled(false);
  });
})();
