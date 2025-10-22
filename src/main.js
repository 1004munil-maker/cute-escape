// main.js — ties UI and game
import { startGame } from './game.js';

const canvas = document.getElementById('game');
const startScreen = document.getElementById('start-screen');
const resultScreen = document.getElementById('result-screen');
const resultTitle = document.getElementById('result-title');
const resultSub = document.getElementById('result-sub');
const btnStart = document.getElementById('btn-start');
const btnNext = document.getElementById('btn-next');
const btnHome = document.getElementById('btn-home');
const btnRetry = document.getElementById('btn-retry');
const timerEl = document.getElementById('timer');

const game = startGame(canvas, {
  onTime: (t)=>{ timerEl.textContent = t.toFixed(1); },
  onOver: (reason)=>{
    resultTitle.textContent = "GAME OVER";
    resultSub.textContent = reason || "";
    resultScreen.classList.remove('hidden');
  },
  onClear: ()=>{
    resultTitle.textContent = "CLEAR!";
    resultSub.textContent = "1-2 に進みますか？（MVP）";
    resultScreen.classList.remove('hidden');
  }
});

btnStart.addEventListener('click', ()=>{
  startScreen.classList.add('hidden');
  game.run();
});
btnHome.addEventListener('click', ()=>{ location.reload(); });
btnRetry.addEventListener('click', ()=>{
  resultScreen.classList.add('hidden');
  game.run();
});
btnNext.addEventListener('click', ()=>{ location.reload(); });
