/** Áudio da mesa: narração em pt-BR e efeitos curtos, tudo local (offline). */

const KEY = "zeno-sound";

export function soundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(KEY) !== "off";
}

export function setSoundEnabled(on: boolean) {
  window.localStorage.setItem(KEY, on ? "on" : "off");
  if (!on) stopSpeaking();
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

let speechLang = "pt-BR";

/** Define o idioma da narração (pt-BR, en-US, es-ES). */
export function setSpeechLang(lang: string) {
  speechLang = lang;
}

export function getSpeechLang(): string {
  return speechLang;
}

/** Carrega a lista de vozes (em alguns navegadores ela chega de forma assíncrona). */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const now = synth.getVoices();
    if (now.length) return resolve(now);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      synth.onvoiceschanged = null;
      resolve(synth.getVoices());
    };
    synth.onvoiceschanged = finish;
    setTimeout(finish, 1200);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string) {
  const target = lang.toLowerCase();
  const prefix = target.slice(0, 2);
  const norm = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace("_", "-");
  return (
    voices.find((v) => norm(v) === target) ??
    voices.find((v) => norm(v).startsWith(prefix)) ??
    null
  );
}

/**
 * "Acorda" a narração dentro de um toque da criança.
 * Navegadores só liberam a voz depois de um gesto do usuário: sem isso, falas
 * disparadas depois de uma resposta da IA saem mudas.
 */
export function primeSpeech() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (!soundEnabled()) return;
  const synth = window.speechSynthesis;
  try {
    if (synth.paused) synth.resume();
    const warm = new SpeechSynthesisUtterance(" ");
    warm.volume = 0;
    warm.lang = speechLang;
    synth.speak(warm);
  } catch {
    /* navegador sem suporte */
  }
}

/** Fala um texto no idioma atual da mesa; ignora se o som estiver desligado. */
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (!soundEnabled() || !text) return;
  const lang = speechLang;
  const synth = window.speechSynthesis;
  if (synth.paused) synth.resume();
  synth.cancel();
  void loadVoices().then((voices) => {
    // idioma mudou enquanto as vozes carregavam
    if (lang !== speechLang || !soundEnabled()) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.95;
    utter.pitch = 1.15;
    const voice = pickVoice(voices, lang);
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    }
    synth.cancel();
    if (synth.paused) synth.resume();
    synth.speak(utter);
  });
}



let ctx: AudioContext | null = null;
function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  return ctx;
}

function tone(freq: number, start: number, duration: number, gain = 0.08) {
  const ac = audioCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  vol.gain.setValueAtTime(gain, ac.currentTime + start);
  vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration);
  osc.connect(vol).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration);
}

export type Sfx = "hit" | "miss" | "win" | "tap";

export function playSfx(kind: Sfx) {
  if (!soundEnabled()) return;
  if (kind === "hit") {
    tone(660, 0, 0.16);
    tone(880, 0.1, 0.22);
  } else if (kind === "miss") {
    tone(220, 0, 0.25, 0.06);
  } else if (kind === "win") {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12, 0.28));
  } else {
    tone(520, 0, 0.07, 0.05);
  }
}
