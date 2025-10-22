// game.js — top-down free movement (no jump), reach goal within time.
// スクロール対応（カメラ）＋ステージ切替（setStage）
import { input, setupInput } from './input.js';

export function startGame(canvas, ui, assets = {}) {
  setupInput();
  const ctx = canvas.getContext('2d', { alpha: false });

  // ======== ワールド／ステージ状態 ========
  let worldW = 9, worldH = 18;       // タイル単位のワールドサイズ
  let camX = 0, camY = 0;            // カメラ位置（タイル）
  let tile = 0;                      // 1タイルのピクセル
  let running = false, over = false, cleared = false;
  let time = 30;

  const player = { x:1, y:1, w:1, h:1, speed:3.0 };
  const goal   = { x:7.5, y:16.0, w:1, h:1 };
  const enemy  = { x:7.5, y:1.0,  r:0.45, speed:1.6 };

  let walls = [];
  let cakes = [];

  // ======== 画面サイズ適用 ========
  function fit() {
    const vp = document.getElementById('viewport');
    const rect = vp.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = Math.floor(rect.width  * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    tile = rect.width / 9; // ビューポート横=9タイルでスケール
  }
  fit();
  addEventListener('resize', fit, { passive:true });

  // ======== ステージ適用 ========
  function applyStage(def){
    // world
    worldW = def.world?.w ?? 9;
    worldH = def.world?.h ?? 18;

    // timer / player / goal / enemy
    time         = def.timer ?? 30;
    player.x     = def.spawn?.x ?? 1;
    player.y     = def.spawn?.y ?? 1;
    goal.x       = def.goal?.x  ?? 7.5;
    goal.y       = def.goal?.y  ?? 16.0;
    enemy.x      = def.enemy?.x ?? 7.5;
    enemy.y      = def.enemy?.y ?? 1.0;
    enemy.r      = def.enemy?.r ?? 0.45;
    enemy.speed  = def.enemy?.speed ?? 1.6;

    // arrays
    walls = def.walls ?? [];
    cakes = def.cakes ?? [];

    // カメラ初期化
    updateCamera(true);
  }

  // ======== カメラ（プレイヤー追従、境界クランプ） ========
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function updateCamera(force=false){
    // プレイヤー中心を画面中央に寄せる
    const cx = player.x + player.w*0.5;
    const cy = player.y + player.h*0.5;
    const targetX = clamp(cx - 9/2,  0, Math.max(0, worldW - 9));
    const targetY = clamp(cy - 18/2, 0, Math.max(0, worldH - 18));
    if (force){
      camX = targetX; camY = targetY;
    } else {
      // ほんの少しだけ追従を滑らかに（負荷ゼロ同然）
      camX += (targetX - camX) * 0.25;
      camY += (targetY - camY) * 0.25;
    }
  }

  // ======== 衝突・判定 ========
  function rectsOverlap(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  // 壁ヒットSEの連打抑制
  let lastBumpAt = 0;
  const BUMP_COOLDOWN = 0.12;

  function moveAndCollide(obj, dx, dy){
    let bumped = false;

    // X
    obj.x += dx;
    for (const w of walls){
      if (rectsOverlap(obj, w)){
        if (dx > 0) obj.x = w.x - obj.w;
        else if (dx < 0) obj.x = w.x + w.w;
        bumped = true;
      }
    }

    // Y
    obj.y += dy;
    for (const w of walls){
      if (rectsOverlap(obj, w)){
        if (dy > 0) obj.y = w.y - obj.h;
        else if (dy < 0) obj.y = w.y + w.h;
        bumped = true;
      }
    }

    // ワールド境界クランプ（外周が無くても出ない）
    obj.x = clamp(obj.x, 0, worldW - obj.w);
    obj.y = clamp(obj.y, 0, worldH - obj.h);

    if (bumped && ui?.onBump){
      const now = performance.now() / 1000;
      if (now - lastBumpAt >= BUMP_COOLDOWN){
        lastBumpAt = now;
        ui.onBump();
      }
    }
  }

  // ======== メインループ ========
  let last = performance.now();
  function loop(now){
    const dt = Math.min(32, now-last) / 1000; last = now;
    if (!running || over || cleared){ requestAnimationFrame(loop); return; }

    // 入力
    let vx=0, vy=0;
    if (input.left)  vx -= 1;
    if (input.right) vx += 1;
    if (input.up)    vy += 1; // 上 = Y+
    if (input.down)  vy -= 1; // 下 = Y-
    if (vx || vy){ const n = Math.hypot(vx,vy); vx/=n; vy/=n; }
    moveAndCollide(player, vx*player.speed*dt, vy*player.speed*dt);

    // 敵（壁無視ホーミング）
    const dx = (player.x+player.w/2) - enemy.x;
    const dy = (player.y+player.h/2) - enemy.y;
    const dn = Math.hypot(dx,dy) || 1;
    enemy.x += (dx/dn) * enemy.speed * dt;
    enemy.y += (dy/dn) * enemy.speed * dt;

    // 判定
    for (const c of cakes){ if (rectsOverlap(player, c)) return gameOver("ケーキに捕まった！"); }
    if (rectsOverlap(player, goal)) return clearStage();
    const ex = enemy.x - (player.x + player.w*0.5);
    const ey = enemy.y - (player.y + player.h*0.5);
    if (ex*ex + ey*ey < (enemy.r*enemy.r)) return gameOver("つかまった！");

    // タイマー
    time -= dt; ui.onTime?.(Math.max(0, time));
    if (time <= 0) return gameOver("時間切れ！");

    // カメラ更新
    updateCamera();

    // 描画
    draw();
    requestAnimationFrame(loop);
  }

  // ======== 座標変換（カメラ考慮） ========
  // ビューポートは常に横9×縦18
  function toPX(x,y,w,h){
    const sx = (x - camX) * tile;
    const sy = (18 - ((y - camY) + h)) * tile;
    const sw = w * tile;
    const sh = h * tile;
    return [sx,sy,sw,sh];
  }
  function drawRR(x,y,w,h,r, fill){
    // ビュー外はスキップ（軽量カリング）
    if (x > camX+9 || x+w < camX || y > camY+18 || y+h < camY) return;
    const [sx,sy,sw,sh] = toPX(x,y,w,h);
    const rr = r*tile;
    const x2 = sx+sw, y2 = sy+sh;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(sx+rr, sy);
    ctx.arcTo(x2, sy, x2, y2, rr);
    ctx.arcTo(x2, y2, sx, y2, rr);
    ctx.arcTo(sx, y2, sx, sy, rr);
    ctx.arcTo(sx, sy, x2, sy, rr);
    ctx.closePath();
    ctx.fill();
  }

  function draw(){
    const W = tile*9, H = tile*18;
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, "#fff8fd"); g.addColorStop(1, "#f2e6f0");
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // ゴール・壁・ケーキ（見える分だけ）
    drawRR(goal.x, goal.y, goal.w, goal.h, 0.2, "#d3f8a6");
    for (const w of walls){ drawRR(w.x, w.y, w.w, w.h, 0.08, "#ffffff"); }
    for (const c of cakes){ drawRR(c.x, c.y, c.w, c.h, 0.2, "#ffb6cc"); }

    // 敵（円）
    if (!(enemy.x+enemy.r < camX || enemy.x-enemy.r > camX+9 ||
          enemy.y+enemy.r < camY || enemy.y-enemy.r > camY+18)){
      const [ex,ey,ew,eh] = toPX(enemy.x - enemy.r, enemy.y - enemy.r, enemy.r*2, enemy.r*2);
      ctx.beginPath();
      ctx.arc(ex + ew/2, ey + eh/2, Math.min(ew,eh)/2, 0, Math.PI*2);
      ctx.fillStyle = "#ffcfe0";
      ctx.fill();
    }

    // プレイヤー（画像 or フォールバック）
    const [px,py,pw,ph] = toPX(player.x, player.y, player.w, player.h);
    const img = assets.getPlayerImg?.();
    if (img){ ctx.drawImage(img, px, py, pw, ph); }
    else { drawRR(player.x, player.y, player.w, player.h, 0.25, "#ffffff"); }
  }

  function gameOver(reason){ if (over || cleared) return; over = true; ui.onOver?.(reason); }
  function clearStage(){ if (over || cleared) return; cleared = true; ui.onClear?.(); }

  // ======== 公開API ========
  return {
    setStage(def){ applyStage(def); },
    run(){
      over=false; cleared=false;
      // タイマーはステージ定義で設定済みだが念のため 0 以下なら30
      if (!(time > 0)) time = 30;
      updateCamera(true);
      // 1フレーム描いてからループ開始
      draw();
      running=true;
      last=performance.now();
      requestAnimationFrame(loop);
    },
    stop(){ running=false; }
  };
}