// game.js — top-down free movement (no jump), reach goal within 30s.
import { input, setupInput } from './input.js';

export function startGame(canvas, ui){
  setupInput();
  const ctx = canvas.getContext('2d', { alpha:false });

  let tile=0, running=false, over=false, cleared=false, time=30;

  function fit(){
    const vp = document.getElementById('viewport');
    const rect = vp.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = rect.width+'px';
    canvas.style.height = rect.height+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    tile = rect.width/9; // width is 9 tiles
  }
  fit();
  addEventListener('resize', fit, {passive:true});

  // World (9x18 tiles)
  const player = { x:1, y:1, w:1, h:1, speed:3.0 };
  const goal   = { x:7.5, y:16.0, w:1, h:1 };
  const enemy  = { x:7.5, y:1.0, r:0.45, speed:1.6 };

  const walls = [
    {x:0, y:0, w:9, h:0.5}, {x:0, y:17.5, w:9, h:0.5},
    {x:0, y:0, w:0.5, h:18}, {x:8.5, y:0, w:0.5, h:18},
    {x:2, y:3, w:5, h:0.5}, {x:2, y:6, w:0.5, h:6},
    {x:3, y:11.5, w:4, h:0.5}, {x:6.5, y:6, w:0.5, h:6},
    {x:1, y:8.5, w:1.5, h:0.5}, {x:1, y:13.5, w:5.5, h:0.5}
  ];
  // Chapter 1: one cake hazard
  const cakes = [ {x:4.2, y:7.2, w:0.9, h:0.9} ];

  function rectsOverlap(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  function moveAndCollide(obj, dx, dy){
    obj.x += dx;
    for (const w of walls){
      if (rectsOverlap(obj, w)){
        if (dx > 0) obj.x = w.x - obj.w;
        else if (dx < 0) obj.x = w.x + w.w;
      }
    }
    obj.y += dy;
    for (const w of walls){
      if (rectsOverlap(obj, w)){
        if (dy > 0) obj.y = w.y - obj.h;
        else if (dy < 0) obj.y = w.y + w.h;
      }
    }
    obj.x = Math.max(0.5, Math.min(9-1.5, obj.x));
    obj.y = Math.max(0.5, Math.min(18-1.5, obj.y));
  }

  let last = performance.now();
  function loop(now){
    const dt = Math.min(32, now-last)/1000; last = now;
    if (!running){ requestAnimationFrame(loop); return; }
    if (over || cleared){ requestAnimationFrame(loop); return; }

    // Input → velocity (8-dir). No jump.
    let vx=0, vy=0;
    if (input.left)  vx -= 1;
    if (input.right) vx += 1;
    if (input.up)    vy += 1;   // up = positive Y
    if (input.down)  vy -= 1;   // down = negative Y
    if (vx !== 0 || vy !== 0){
      const n = Math.hypot(vx,vy);
      vx/=n; vy/=n;
    }
    moveAndCollide(player, vx*player.speed*dt, vy*player.speed*dt);

    // Enemy homing (ignores walls to keep it simple)
    const dx = (player.x+player.w/2) - enemy.x;
    const dy = (player.y+player.h/2) - enemy.y;
    const dn = Math.hypot(dx,dy) || 1;
    enemy.x += (dx/dn) * enemy.speed * dt;
    enemy.y += (dy/dn) * enemy.speed * dt;

    // Cakes
    for (const c of cakes){
      if (rectsOverlap(player, c)) return gameOver("ケーキに捕まった！");
    }
    // Goal
    if (rectsOverlap(player, goal)) return clearStage();
    // Enemy hit
    const ex = enemy.x - (player.x+player.w*0.5);
    const ey = enemy.y - (player.y+player.h*0.5);
    if (ex*ex + ey*ey < (enemy.r*enemy.r)) return gameOver("つかまった！");

    // Timer
    time -= dt;
    ui.onTime(Math.max(0, time));
    if (time <= 0) return gameOver("時間切れ！");

    // Draw
    draw();
    requestAnimationFrame(loop);
  }

  function toPX(x,y,w,h){
    const sx = x*tile;
    const sy = (18 - (y+h))*tile;
    const sw = w*tile;
    const sh = h*tile;
    return [sx,sy,sw,sh];
  }
  function drawRR(x,y,w,h,r, fill){
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
    // Background
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, "#fff8fd"); g.addColorStop(1,"#f2e6f0");
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // Goal
    drawRR(goal.x, goal.y, goal.w, goal.h, 0.2, "#d3f8a6");

    // Walls
    for (const w of walls){ drawRR(w.x, w.y, w.w, w.h, 0.08, "#ffffff"); }

    // Cakes
    for (const c of cakes){ drawRR(c.x, c.y, c.w, c.h, 0.2, "#ffb6cc"); }

    // Enemy (circle)
    const [ex,ey,ew,eh] = toPX(enemy.x-enemy.r, enemy.y-enemy.r, enemy.r*2, enemy.r*2);
    ctx.beginPath(); ctx.arc(ex+ew/2, ey+eh/2, Math.min(ew,eh)/2, 0, Math.PI*2); ctx.fillStyle = "#ffcfe0"; ctx.fill();

    // Player (cute square with cheeks & ribbon)
    drawRR(player.x, player.y, player.w, player.h, 0.25, "#ffffff");
    const [px,py,pw,ph] = toPX(player.x, player.y, player.w, player.h);
    // cheeks
    ctx.fillStyle = "#ff9db8";
    ctx.beginPath(); ctx.arc(px+pw*0.28, py+ph*0.72, pw*0.08, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px+pw*0.72, py+ph*0.72, pw*0.08, 0, Math.PI*2); ctx.fill();
    // ribbon (top-left)
    ctx.fillStyle = "#ff8fb1";
    ctx.beginPath(); ctx.arc(px+pw*0.25, py+ph*0.25, pw*0.10, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px+pw*0.38, py+ph*0.23, pw*0.08, 0, Math.PI*2); ctx.fill();
  }

  function gameOver(reason){ if (over||cleared) return; over=true; ui.onOver(reason); }
  function clearStage(){ if (over||cleared) return; cleared=true; ui.onClear(); }

  return {
    run(){
      over=false; cleared=false; time=30;
      player.x=1; player.y=1;
      enemy.x=7.5; enemy.y=1.0;
      draw();
      running=true;
      last=performance.now();
      requestAnimationFrame(loop);
    },
    stop(){ running=false; }
  };
}
