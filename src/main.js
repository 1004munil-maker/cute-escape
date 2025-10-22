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
  // decode() で描画前にデコード完了を保証（jank回避）
  if (img.decode) { await img.decode(); }
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(img);
    } catch {
      // 一部環境で失敗したらそのまま Image を返す
    }
  }
  return img; // 旧環境は通常の Image を使用
}

/* ============================
   キャラ画像（PNG）をプリロード
============================ */
// 必要に応じてパスは調整してね
const charSrcs = {
  ribbon: './public/assets/png/player-ribbon-256.png',
  boy:    './public/assets/png/player-boy-256.png'
};

const charImages = {};
let currentChar = 'ribbon';

const preloadPromise = Promise.all(
  Object.entries(charSrcs).map(async ([key, src])=>{
    charImages[key] = await loadBitmap(src);
  })
);

/* ============================
   SFX
============================ */
const sfx = makeSfx();

/* ============================
   Game 起動（assets 経由で画像を渡す）
============================ */
const game = startGame(canvas, {
  onTime: (t) => { timerEl.textContent = t.toFixed(1); },
  onOver: (reason) => {
    resultTitle.textContent = "GAME OVER";
    resultSub.textContent = reason || "";
    resultScreen.classList.remove('hidden');
    sfx.play('lose');
  },
  onClear: () => {
    resultTitle.textContent = "CLEAR!";
    resultSub.textContent = "1-2 に進みますか？（MVP）";
    resultScreen.classList.remove('hidden');
    sfx.play('clear');
  },
  onBump: () => { sfx.play('bum'); }
}, {
  getPlayerImg: () => charImages[currentChar]
});

/* ============================
   キャラ選択 UI
============================ */
const charBtns = document.querySelectorAll('.char-btn');

function updateSelectedUI(){
  charBtns.forEach(btn=>{
    btn.classList.toggle('selected', btn.dataset.char === currentChar);
  });
}
charBtns.forEach(btn=>{
  const key = btn.dataset.char;
  // 押しやすさ重視で pointerup、保険で click
  const choose = (e) => {
    e.preventDefault();
    currentChar = key;
    updateSelectedUI();
  };
  btn.addEventListener('pointerup', choose, { passive:false });
  btn.addEventListener('click',     choose, { passive:false });
});
updateSelectedUI();

/* ============================
   START
============================ */
const startHandler = async (e) => {
  e.preventDefault();
  await preloadPromise;   // 画像読み込みを待つ
  await sfx.unlock();     // iOS等で最初の操作時に解錠
  sfx.play('start');
  startScreen.classList.add('hidden');
  game.run();
};
btnStart.addEventListener('pointerup', startHandler, { passive:false });
btnStart.addEventListener('click',     startHandler, { passive:false });

/* ============================
   その他
============================ */
btnHome.addEventListener('click', () => { location.reload(); });
btnRetry.addEventListener('click', () => {
  resultScreen.classList.add('hidden');
  game.run();
});
btnNext.addEventListener('click', () => { location.reload(); });