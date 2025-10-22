/* ============================
   キャラ選択 UI（パネル安定版）
============================ */
const btnChoose = document.getElementById('btn-choose'); // 無い環境もあり
const charPanel = document.getElementById('char-panel'); // 無い環境もあり
const charBtns  = document.querySelectorAll('.char-btn');

function paintThumbCanvas(btn){
  const key = btn.dataset.char;
  const img = charImages[key];
  const cvs = btn.querySelector('.char-thumb');
  if (!cvs || !img) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const sizeCSS = parseInt(getComputedStyle(cvs).width, 10) || 24;

  cvs.width  = Math.floor(sizeCSS * dpr);
  cvs.height = Math.floor(sizeCSS * dpr);
  const ctx = cvs.getContext('2d', { alpha: true });
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,sizeCSS,sizeCSS);
  ctx.drawImage(img, 0, 0, sizeCSS, sizeCSS);
}
function paintAllThumbs(){ charBtns.forEach(paintThumbCanvas); }

function updateSelectedUI(){
  charBtns.forEach(btn=>{
    const isSel = btn.dataset.char === currentChar;
    btn.classList.toggle('selected', isSel);
    btn.setAttribute('aria-pressed', String(isSel));
  });
}

// === トグルの競合対策つき setCharPanel ===
let isToggling = false;
let hideTimer = null;
function setCharPanel(open){
  if (!btnChoose || !charPanel) return;
  if (isToggling) return;
  isToggling = true;
  clearTimeout(hideTimer);

  if (open) {
    // 開く
    charPanel.hidden = false;
    // 1フレーム待ってからopenクラス付与（トランジション起動）
    requestAnimationFrame(()=>{
      charPanel.classList.add('open');
      btnChoose.setAttribute('aria-expanded', 'true');
      // 画像がまだならここで描く（preload後）
      preloadPromise.then(()=> paintAllThumbs()).catch(()=>{});
      // アニメ終了後にロック解除
      setTimeout(()=>{ isToggling = false; }, 260);
    });
  } else {
    // 閉じる
    charPanel.classList.remove('open');
    btnChoose.setAttribute('aria-expanded', 'false');
    hideTimer = setTimeout(()=>{
      charPanel.hidden = true;
      isToggling = false;
    }, 260);
  }
}

// 初期：閉じる（要素がある場合のみ）
if (btnChoose && charPanel){
  setCharPanel(false);

  // click は使わず pointerup のみ（ダブル発火防止）
  const togglePanel = (e) => {
    e.preventDefault();
    const open = charPanel.hidden || !charPanel.classList.contains('open');
    setCharPanel(open);
    if (open) setTimeout(()=> charBtns[0]?.focus?.(), 10);
  };
  btnChoose.addEventListener('pointerup', togglePanel, { passive:false });
}

// キャラ選択ボタン（UIフィードバック＋選択確定で自動クローズ）
charBtns.forEach(btn=>{
  const key = btn.dataset.char;

  const choose = (e) => {
    e.preventDefault();
    currentChar = key;
    updateSelectedUI();
    try { sfx?.play?.('tick'); } catch {}
    if (btnChoose && charPanel) setCharPanel(false);
  };

  btn.addEventListener('pointerdown', ()=> btn.classList.add('pressed'));
  btn.addEventListener('pointerup',   (e)=>{ btn.classList.remove('pressed'); choose(e); }, {passive:false});
  btn.addEventListener('pointercancel', ()=> btn.classList.remove('pressed'));
  btn.addEventListener('pointerleave',  ()=> btn.classList.remove('pressed'));
  // click は保険として残したい場合は下を有効化（※二重発火し得る環境では不要）
  // btn.addEventListener('click', (e)=>{ btn.classList.remove('pressed'); choose(e); }, {passive:false});
});

preloadPromise.then(()=> paintAllThumbs()).catch(()=>{});
addEventListener('resize', ()=> paintAllThumbs(), { passive:true });
updateSelectedUI();

/* ============================
   START（二重起動ガード付き）
============================ */
let started = false;
const startHandler = async (e) => {
  e.preventDefault();
  if (started) return;
  started = true;

  try { await preloadPromise; } catch {}
  try { await sfx?.unlock?.(); } catch {}
  try { sfx?.play?.('start'); } catch {}
  startScreen.classList.add('hidden');
  game.run();
};
btnStart.addEventListener('pointerup', startHandler, { passive:false });
// click は不要（pointerup と二重発火しやすいので外す）