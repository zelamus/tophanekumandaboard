// Ses efektleri — tarayıcı içinde sentez (Web Audio API)
//
// Her cihazın sesi kod ile kurulur: kontaktör çekme/bırakma çakı, motor
// hum'u, termik (sigorta) atma çakı, kısa devre cızırtısı, kesici çakı,
// düğme tıkı. Harici ses dosyası GEREKMEZ; ama isterse "public/sounds"
// altına <ad>.wav konursa (contactor, relay, button, breaker, termik,
// short, motor) sentez yerine o örnek kullanılır — sfx.loadSamples()
// ilk etkileşimde sessizce dener, bulunamayan adlar sentezde kalır.
//
// Çıkış: tek master gain — ayar sesi açık/kapalı + ses seviyesi.

type Ctx = AudioContext;

const engine = {
  ctx: null as Ctx | null,
  master: null as GainNode | null,
  on: true,
  vol: 0.5,
  motor: { running: false, nodes: [] as AudioNode[] },
};

/* ================================================================
   örnek ses köprüsü — /sounds/*.wav bulunduğunda sentezin yerine geçer
   ================================================================ */

type SampleName = 'contactor' | 'relay' | 'button' | 'breaker' | 'termik' | 'short' | 'motor';

const SAMPLE_NAMES: SampleName[] = ['contactor', 'relay', 'button', 'breaker', 'termik', 'short', 'motor'];

/** null = denendi, bulunamadı (tekrar istenmez) */
const samples = new Map<SampleName, AudioBuffer | null>();

async function getSample(name: SampleName): Promise<AudioBuffer | null> {
  const ctx = ensureCtx();
  if (!ctx) return null;
  if (samples.has(name)) return samples.get(name)!;
  try {
    const r = await fetch(`sounds/${name}.wav`);
    if (!r.ok) { samples.set(name, null); return null; }
    const buf = await ctx.decodeAudioData(await r.arrayBuffer());
    samples.set(name, buf);
    return buf;
  } catch {
    samples.set(name, null);
    return null;
  }
}

/** Önceden yüklenmiş örneği çalar; örnek yoksa false (sentez sürer) */
function playSample(name: SampleName, rate = 1): boolean {
  const ctx = ensureCtx();
  const buf = samples.get(name);
  if (!ctx || !buf || !engine.on) return false;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  src.connect(engine.master!);
  src.start();
  return true;
}

/** Örnek dosyaları yükler — ilk etkileşimde kendiliğinden çağrılır */
export async function loadSamples(): Promise<void> {
  await Promise.all(SAMPLE_NAMES.map(getSample));
}

function ensureCtx(): Ctx | null {
  try {
    if (!engine.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      engine.ctx = new AC();
      engine.master = engine.ctx!.createGain();
      engine.master.gain.value = engine.on ? engine.vol : 0;
      engine.master.connect(engine.ctx!.destination);
    }
    if (engine.ctx!.state === 'suspended') void engine.ctx!.resume();
    return engine.ctx;
  } catch { return null; }
}

function noiseBuffer(ctx: Ctx, saniye: number): AudioBuffer {
  const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * saniye), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

/** Tık sesi: kısa gürültü + bandpass — mekanik çakı çekirdeği */
function click(ctx: Ctx, at: number, gelGec: number, freq: number, q: number, vol: number): void {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 0.05);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + gelGec);
  src.connect(bp).connect(g).connect(engine.master!);
  src.start(at);
  src.stop(at + gelGec + 0.02);
}

/** Düşük gövde vuruşu: sinüs çöküşü — kontaktör gövdesinin oturması */
function thump(ctx: Ctx, at: number, f0: number, f1: number, süre: number, vol: number): void {
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, at);
  o.frequency.exponentialRampToValueAtTime(f1, at + süre);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + süre);
  o.connect(g).connect(engine.master!);
  o.start(at);
  o.stop(at + süre + 0.02);
}

/* ================================================================
   cihaz sesleri
   ================================================================ */

export const sfx = {
  /** Ayar uygula — kapatıldığında master gain 0, motor döngüsü durur */
  configure(on: boolean, vol: number): void {
    engine.on = on;
    engine.vol = vol;
    if (engine.master) engine.master.gain.value = on ? vol : 0;
    if (!on && engine.motor.running) sfx.motor(false);
  },

  /** İlk kullanıcı hareketinde AudioContext'i uyandır (tarayıcı politikası) */
  wake(): void {
    ensureCtx();
    void loadSamples(); // sessiz: bulunamayan adlar sentezde kalır
  },

  /** Kontaktör çekildi (on) / düştü (off) — çakı + gövde thump */
  contactor(on: boolean): void {
    const ctx = ensureCtx();
    if (!ctx || !engine.on) return;
    if (playSample('contactor', on ? 1 : 0.85)) return;
    const t = ctx.currentTime + 0.01;
    click(ctx, t, on ? 0.05 : 0.04, on ? 2100 : 1500, 2.5, on ? 0.7 : 0.45);
    thump(ctx, t + 0.005, on ? 150 : 120, on ? 62 : 70, 0.09, on ? 0.5 : 0.32);
    if (on) click(ctx, t + 0.018, 0.03, 3200, 3, 0.18); // ikinci hafif ek
  },

  /** Mini takma röle (d1) — kontaktörden daha hafif */
  relay(on: boolean): void {
    const ctx = ensureCtx();
    if (!ctx || !engine.on) return;
    if (playSample('relay', on ? 1 : 0.88)) return;
    const t = ctx.currentTime + 0.01;
    click(ctx, t, 0.03, 2600, 3, on ? 0.4 : 0.28);
  },

  /** Buton tık — bas/bırak, çok hafif */
  button(down: boolean): void {
    const ctx = ensureCtx();
    if (!ctx || !engine.on) return;
    if (playSample('button', down ? 1 : 0.9)) return;
    const t = ctx.currentTime + 0.005;
    click(ctx, t, 0.015, down ? 3400 : 2600, 4, down ? 0.22 : 0.14);
  },

  /** Kesici kol — tok çift çakı; kapamada daha tok */
  breaker(on: boolean): void {
    const ctx = ensureCtx();
    if (!ctx || !engine.on) return;
    if (playSample('breaker', on ? 1 : 0.85)) return;
    const t = ctx.currentTime + 0.01;
    click(ctx, t, 0.04, on ? 1900 : 1300, 2.2, 0.55);
    click(ctx, t + 0.032, 0.05, on ? 1300 : 900, 2, on ? 0.4 : 0.55);
    thump(ctx, t + 0.012, 210, 90, 0.08, on ? 0.3 : 0.45);
  },

  /** Termik (sigorta) attı — keskin çakı + alçalan uğultu */
  termik(): void {
    const ctx = ensureCtx();
    if (!ctx || !engine.on) return;
    if (playSample('termik')) return;
    const t = ctx.currentTime + 0.01;
    click(ctx, t, 0.02, 4200, 1.6, 0.75);
    // alçalan cızırt
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(190, t + 0.16);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2100;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
    o.connect(lp).connect(g).connect(engine.master!);
    o.start(t);
    o.stop(t + 0.22);
    thump(ctx, t + 0.03, 160, 60, 0.14, 0.4);
  },

  /** Kısa devre — keskin kule sinseltisi: hızlı buğlamsı cızırt */
  short(): void {
    const ctx = ensureCtx();
    if (!ctx || !engine.on) return;
    if (playSample('short')) return;
    const t = ctx.currentTime + 0.01;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = 128;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    // tremolo: 22 Hz buzz
    const lfo = ctx.createOscillator();
    lfo.type = 'sawtooth';
    lfo.frequency.value = 26;
    const lg = ctx.createGain();
    lg.gain.value = 0.5;
    lfo.connect(lg).connect(g.gain);
    g.gain.setValueAtTime(0.5, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(lp).connect(g).connect(engine.master!);
    o.start(t);
    o.stop(t + 0.45);
    lfo.start(t);
    lfo.stop(t + 0.45);
  },

  /** Motor: çalıştı → hum yumuşak yükselir; durdu → söner. Tekrar çağrı idempotent. */
  motor(on: boolean): void {
    const ctx = ensureCtx();
    if (!ctx || !engine.master) return;
    if (on && engine.motor.running) return;
    if (!on && !engine.motor.running) return;
    if (on) {
      engine.motor.running = true;
      const t0 = ctx.currentTime;
      // örnek: /sounds/motor.wav yüklüyse döngü örnekle akar
      const ms = samples.get('motor');
      if (ms) {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.9);
        g.connect(engine.master);
        const src = ctx.createBufferSource();
        src.buffer = ms;
        src.loop = true;
        src.connect(g);
        src.start();
        engine.motor.nodes = [g, src];
        return;
      }
      // taşıyıcı: osc → lowpass → gain → master
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.24, t0 + 0.9);
      g.connect(engine.master);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 460;
      lp.connect(g);
      // rotor: 50 Hz temel + harmonikleri
      const partler: [OscillatorType, number, number][] = [
        ['sawtooth', 50, 1],
        ['sawtooth', 100, 0.55],
        ['sine', 150, 0.4],
      ];
      const oscs: OscillatorNode[] = [];
      for (const [tip, f, k] of partler) {
        const o = ctx.createOscillator();
        o.type = tip;
        o.frequency.value = f;
        const og = ctx.createGain();
        og.gain.value = k;
        o.connect(og);
        og.connect(lp);
        o.start();
        oscs.push(o);
      }
      // kanat hissi: yumuşak bant geçiren gürültü
      const nz = ctx.createBufferSource();
      nz.buffer = noiseBuffer(ctx, 2);
      nz.loop = true;
      const nbp = ctx.createBiquadFilter();
      nbp.type = 'bandpass';
      nbp.frequency.value = 720;
      nbp.Q.value = 0.7;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t0);
      ng.gain.exponentialRampToValueAtTime(0.05, t0 + 1.1);
      nz.connect(nbp);
      nbp.connect(ng);
      ng.connect(engine.master);
      nz.start();
      // sarsıntı: hum 7 Hz'de hafif titreşir
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 7;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 0.045;
      lfo.connect(lfoG);
      lfoG.connect(g.gain);
      lfo.start();
      engine.motor.nodes = [...oscs, nz, lfo, g, ng, lp, nbp];
    } else {
      engine.motor.running = false;
      const t = ctx.currentTime;
      const nodes = engine.motor.nodes;
      engine.motor.nodes = [];
      for (const n of nodes) {
        const ga = (n as GainNode).gain;
        if (ga) ga.setTargetAtTime(0.0001, t, 0.25);
      }
      setTimeout(() => {
        for (const n of nodes) {
          if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) {
            try { n.stop(); } catch { /* zaten durdu */ }
          }
          try { n.disconnect(); } catch { /* noop */ }
        }
      }, 1260);
    }
  },
};

// İlk kullanıcı hareketinde uyandır (tarayıcı Gesture politikası)
if (typeof window !== 'undefined') {
  const wakeOnce = (): void => {
    sfx.wake();
    window.removeEventListener('pointerdown', wakeOnce);
    window.removeEventListener('keydown', wakeOnce);
  };
  window.addEventListener('pointerdown', wakeOnce, { once: true });
  window.addEventListener('keydown', wakeOnce, { once: true });
}
