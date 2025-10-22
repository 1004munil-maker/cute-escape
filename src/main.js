// main.js — ties UI, character select, SFX, and game
import { startGame } from './game.js';
import { makeSfx } from './sfx.js';

const canvas = document.getElementById('game');
const startScreen = document.getElementById('start-screen');
const resultScreen = document.getElementById('result-screen');
const resultTitle = document.getElementById('result-title');
const resultSub   = document.getElementById('result-sub');
const btnStart = document.getElementById('btn-start');
const btnNext  = document.getElementById('btn-next');
const btnHome  = document.getElementById('btn-home');
const btnRetry = document.getElementById('btn-retry');
const timerEl  = document.getElementById('timer');

/* ============================
   画像を ImageBitmap 化して軽くする
============================ */
async function loadBitmap(src){
  const img = new Image();
  img.src = src;
  if (img.decode) { try { await img.decode(); } catch {} }
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(img); } catch {}
  }
  return img; // 旧環境は通常の Image を使用
}

/* ============================
   キャラ画像（PNG）をプリロード
============================ */
const charSrcs = {

  ribbon: '/cute-escape/public/assets/player-ribbon-256.png?v=20251025',
  boy:    '/cute-escape/public/assets/player-boy-256.png?v=20251025'
};

const charImages = {};
let currentChar = 'ribbon';

const preloadPromise = Promise.all(
  Object.entries(charSrcs).map(async ([key, src])=>{
    charImages[key] = await loadBitmap(src);
  })
).catch(err=>{
  // 画像が1つでも失敗しても、ゲームは続行できるようにする
  console.warn('[preload]', err);
});

/* ============================
   SFX
============================ */
let sfx;
try { sfx = makeSfx(); } catch { sfx = null; }

/* ============================
   Game 起動（assets 経由で画像を渡す）
============================ */
const game = startGame(canvas, {
  onTime: (t) => { timerEl.textContent = t.toFixed(1); },
  onOver: (reason) => {
    resultTitle.textContent = "GAME OVER";
    resultSub.textContent = reason || "";
    resultScreen.classList.remove('hidden');
    try { sfx?.play?.('lose'); } catch {}
  },
  onClear: () => {
    resultTitle.textContent = "CLEAR!";
    resultSub.textContent = "1-2 に進みますか？（MVP）";
    resultScreen.classList.remove('hidden');
    try { sfx?.play?.('clear'); } catch {}
  },
  onBump: () => { try { sfx?.play?.('bum'); } catch {} }
}, {
  getPlayerImg: () => charImages[currentChar]
});

/* ============================
   キャラ選択 UI（パネル対応・無くても動作）
============================ */
const btnChoose = document.getElementById('btn-choose'); // ない場合もあり
const charPanel = document.getElementById('char-panel'); // ない場合もあり
const charBtns  = document.querySelectorAll('.char-btn');

function updateSelectedUI(){
  charBtns.forEach(btn=>{
    const isSel = btn.dataset.char === currentChar;
    btn.classList.toggle('selected', isSel);
    btn.setAttribute('aria-pressed', String(isSel));
  });
}

function setCharPanel(open){
  if (!btnChoose || !charPanel) return; // 要素が無ければスキップ
  if (open) {
    charPanel.hidden = false;
    requestAnimationFrame(()=> charPanel.classList.add('open'));
  } else {
    charPanel.classList.remove('open');
    setTimeout(()=>{ charPanel.hidden = true; }, 220);
  }
  btnChoose.setAttribute('aria-expanded', String(open));
}

// トグルボタン（存在する時だけ）
if (btnChoose && charPanel){
  setCharPanel(false);
  const togglePanel = (e) => {
    e.preventDefault();
    const open = charPanel.hidden || !charPanel.classList.contains('open');
    setCharPanel(open);
    if (open) setTimeout(()=> charBtns[0]?.focus?.(), 10);
  };
  btnChoose.addEventListener('pointerup', togglePanel, {passive:false});
  btnChoose.addEventListener('click',     togglePanel, {passive:false});
}

// キャラ選択ボタン（常設でもパネル内でもOK）
charBtns.forEach(btn=>{
  const key = btn.dataset.char;

  const choose = (e) => {
    e.preventDefault();
    currentChar = key;
    updateSelectedUI();
    try { sfx?.play?.('tick'); } catch {}
    // パネルがあれば閉じる
    if (btnChoose && charPanel) setCharPanel(false);
  };

  btn.addEventListener('pointerdown', ()=> btn.classList.add('pressed'));
  btn.addEventListener('pointerup',   (e)=>{ btn.classList.remove('pressed'); choose(e); }, {passive:false});
  btn.addEventListener('pointercancel', ()=> btn.classList.remove('pressed'));
  btn.addEventListener('pointerleave',  ()=> btn.classList.remove('pressed'));
  btn.addEventListener('click', (e)=>{ btn.classList.remove('pressed'); choose(e); }, {passive:false});
});
updateSelectedUI();

/* ============================
   START
============================ */
const startHandler = async (e) => {
  e.preventDefault();

  // 画像プリロードは best-effort（失敗してもゲームは走らせる）
  try { await preloadPromise; } catch {}

  // 音の解錠は best-effort
  try { await sfx?.unlock?.(); } catch {}

  try { sfx?.play?.('start'); } catch {}
  startScreen.classList.add('hidden');
  game.run();
};
btnStart.addEventListener('pointerup', startHandler, { passive:false });
btnStart.addEventListener('click',     startHandler, { passive:false });

/* ============================
   その他
============================ */
btnHome?.addEventListener('click', () => { location.reload(); });
btnRetry?.addEventListener('click', () => {
  resultScreen.classList.add('hidden');
  game.run();
});
btnNext?.addEventListener('click', () => { location.reload(); });