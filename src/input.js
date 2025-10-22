// input.js — 4方向のみ
export const input = { left:false, right:false, up:false, down:false };

function press(key, v){ input[key] = v; }

function bindBtn(id, key){
  const el = document.getElementById(id);
  const on = (e)=>{ e.preventDefault(); press(key,true); el.setPointerCapture?.(e.pointerId); };
  const off = (e)=>{ e.preventDefault(); press(key,false); };
  const opts = {passive:false};
  el.addEventListener('pointerdown', on, opts);
  el.addEventListener('pointerup', off, opts);
  el.addEventListener('pointercancel', off, opts);
  el.addEventListener('pointerleave', off, opts);
}

function bindKeys(){
  window.addEventListener('keydown', e=>{
    if (e.repeat) return;
    if (e.key === 'ArrowLeft' ) press('left', true);
    if (e.key === 'ArrowRight') press('right', true);
    if (e.key === 'ArrowUp'   ) press('up', true);
    if (e.key === 'ArrowDown' ) press('down', true);
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) e.preventDefault();
  }, {passive:false});
  window.addEventListener('keyup', e=>{
    if (e.key === 'ArrowLeft' ) press('left', false);
    if (e.key === 'ArrowRight') press('right', false);
    if (e.key === 'ArrowUp'   ) press('up', false);
    if (e.key === 'ArrowDown' ) press('down', false);
  });
}

export function setupInput(){
  bindBtn('btn-left','left');
  bindBtn('btn-right','right');
  bindBtn('btn-up','up');
  bindBtn('btn-down','down');
  bindKeys();
}
