// main.js — ties UI and game
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

// ▼ SFX 準備（先頭に全角スペースを置かないこと！）
const sfx = makeSfx();

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
  onBump: () => { sfx.play('bum'); }   // ← ここにカンマ忘れない
});

// タップ取りこぼし回避のため pointerup を主に、保険で click も登録
const startHandler = async (e) => {
  e.preventDefault();
  startScreen.classList.add('hidden');
  await sfx.unlock();     // iOS等で最初のユーザー操作時に解錠
  sfx.play('start');
  game.run();
};
btnStart.addEventListener('pointerup', startHandler, { passive:false });
btnStart.addEventListener('click',     startHandler, { passive:false });

btnHome.addEventListener('click', () => { location.reload(); });
btnRetry.addEventListener('click', () => {
  resultScreen.classList.add('hidden');
  game.run();
});
btnNext.addEventListener('click', () => { location.reload(); });