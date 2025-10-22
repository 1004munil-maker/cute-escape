/* ============================
   キャラ選択 UI（安定版：選択中はロック）
============================ */
const btnChoose = document.getElementById('btn-choose'); // 無い環境もあり
const charPanel = document.getElementById('char-panel'); // 無い環境もあり
const charBtns  = document.querySelectorAll('.char-btn');

function updateSelectedUI(){
  charBtns.forEach(btn=>{
    const isSel = btn.dataset.char === currentChar;
    btn.classList.toggle('selected', isSel);
    btn.setAttribute('aria-pressed', String(isSel));
  });
}

// ★ 選択～クローズ完了までロック
let chooseLocked = false;
let hideTimer = null;
function lockUI(lock){
  charBtns.forEach(b => b.disabled = lock);
  if (btnChoose) btnChoose.disabled = lock;
}

function setCharPanel(open){
  if (!btnChoose || !charPanel) return;
  clearTimeout(hideTimer);

  if (open) {
    charPanel.hidden = false;
    requestAnimationFrame(()=>{
      charPanel.classList.add('open');
      btnChoose.setAttribute('aria-expanded', 'true');
    });
  } else {
    // クローズ → アニメ終了後に hidden & ロック解除
    charPanel.classList.remove('open');
    btnChoose.setAttribute('aria-expanded', 'false');
    hideTimer = setTimeout(()=>{
      charPanel.hidden = true;
      lockUI(false);       // ← ここで解除
      chooseLocked = false;
    }, 240);               // CSS のトランジション時間に合わせる
  }
}

// 初期化（ある時だけ）
if (btnChoose && charPanel){
  setCharPanel(false);
  const togglePanel = (e) => {
    e.preventDefault();
    const open = charPanel.hidden || !charPanel.classList.contains('open');
    setCharPanel(open);
    if (open) setTimeout(()=> charBtns[0]?.focus?.(), 10);
  };
  // ★ click は使わず pointerup のみ（ダブル発火防止）
  btnChoose.addEventListener('pointerup', togglePanel, { passive:false });
}

// キャラ選択
charBtns.forEach(btn=>{
  const key = btn.dataset.char;

  const choose = (e) => {
    e.preventDefault();
    if (chooseLocked) return; // ★ 既に選択中なら無視
    chooseLocked = true;
    lockUI(true);

    currentChar = key;
    updateSelectedUI();
    try { sfx?.play?.('tick'); } catch {}

    // パネルがある場合は閉じる（閉じきったらロック解除される）
    if (btnChoose && charPanel) setCharPanel(false);
    else { // パネルが無い配置なら即解除
      lockUI(false);
      chooseLocked = false;
    }
  };

  btn.addEventListener('pointerdown', ()=> btn.classList.add('pressed'));
  btn.addEventListener('pointerup',   (e)=>{ btn.classList.remove('pressed'); choose(e); }, {passive:false});
  btn.addEventListener('pointercancel', ()=> btn.classList.remove('pressed'));
  btn.addEventListener('pointerleave',  ()=> btn.classList.remove('pressed'));
  // ★ click は付けない（pointerup と二重実行になる環境がある）
});

updateSelectedUI();