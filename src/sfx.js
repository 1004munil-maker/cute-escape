// src/sfx.js
// 軽量SFX: "bum"(衝突) / "start" / "clear" / "lose"
export function makeSfx() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  let unlocked = false;

  async function unlock() {
    if (unlocked) return;
    // iOS対策: ユーザー操作でresume
    try { await ctx.resume(); } catch {}
    // 無音発音でデバイスを起こす
    const n = ctx.createOscillator(); const g = ctx.createGain();
    g.gain.value = 0; n.connect(g).connect(ctx.destination); n.start(); n.stop(ctx.currentTime + 0.01);
    unlocked = true;
  }

  // エンベロープ作成
  function env(duration = 0.35, peak = 0.8) {
    const g = ctx.createGain();
    const now = ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    return g;
  }

  // Pitch を下げる「ドン」= bum
  function playBum() {
    const o = ctx.createOscillator();
    const g = env(0.28, 0.9);
    o.type = 'sine';
    const now = ctx.currentTime;
    // 低音から更に急落（キック風）
    o.frequency.setValueAtTime(220, now);
    o.frequency.exponentialRampToValueAtTime(60, now + 0.12);
    // クリックを少なくするため少しドライブ
    const dist = ctx.createWaveShaper();
    dist.curve = new Float32Array([0, 0.2, 0.5, 0.8, 1.0]);
    o.connect(dist).connect(g).connect(ctx.destination);
    o.start(); o.stop(now + 0.3);
  }

  function playStart() {
    const o = ctx.createOscillator();
    const g = env(0.2, 0.6);
    o.type = 'triangle';
    const now = ctx.currentTime;
    o.frequency.setValueAtTime(660, now);
    o.frequency.exponentialRampToValueAtTime(990, now + 0.06);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(now + 0.18);
  }

  function playClear() {
    // 小さな上昇2トーン
    const now = ctx.currentTime;
    const tone = (f, t0, dur) => {
      const o = ctx.createOscillator(); const g = env(dur, 0.5);
      o.type = 'sine'; o.frequency.setValueAtTime(f, now + t0);
      o.connect(g).connect(ctx.destination);
      o.start(now + t0); o.stop(now + t0 + dur);
    };
    tone(880, 0.00, 0.18);
    tone(1175,0.10, 0.18);
  }

  function playLose() {
    const o = ctx.createOscillator(); const g = env(0.4, 0.7);
    o.type = 'sawtooth';
    const now = ctx.currentTime;
    o.frequency.setValueAtTime(240, now);
    o.frequency.exponentialRampToValueAtTime(90, now + 0.25);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(now + 0.35);
  }

  function playTick() {
    const o = ctx.createOscillator(); const g = env(0.08, 0.6);
    o.type = 'square';
    const now = ctx.currentTime;
    o.frequency.setValueAtTime(1200, now);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(now + 0.07);
  }

  const play = (name) => {
    if (!unlocked) return; // まだunlockしてないと音が出ない環境あり（iOS）
    ({ bum: playBum, start: playStart, clear: playClear, lose: playLose, tick: playTick }[name] || (()=>{}))();
  };

  return { ctx, unlock, play };
}