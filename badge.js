/* Plain JavaScript lanyard badge. The physics model is also runnable in Node tests. */
(function () {
  'use strict';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  class BadgePhysics {
    constructor(width, height, cardWidth, cardHeight) {
      this.resize(width, height, cardWidth, cardHeight);
    }
    resize(width, height, cardWidth, cardHeight) {
      this.width = width; this.height = height;
      this.cardWidth = cardWidth; this.cardHeight = cardHeight;
      this.anchor = { x: width / 2, y: 24 };
      this.gravity = 900; this.stiffness = 150;
      this.length = Math.min(240, Math.max(45, height - cardHeight - 28 - 24 - 76));
      this.maxAngle = Math.min(0.38, Math.atan2(Math.max(0, width - cardWidth - 32), cardHeight + 28));
      this.reset();
    }
    reset() {
      this.x = this.anchor.x; this.y = this.anchor.y + this.length + this.gravity / this.stiffness;
      this.vx = 0; this.vy = 0; this.angle = 0; this.angularVelocity = 0;
      this.constrain();
    }
    constrain() {
      this.angle = clamp(this.angle, -this.maxAngle, this.maxAngle);
      const sin = Math.sin(this.angle), cos = Math.cos(this.angle);
      const corners = [[-this.cardWidth / 2, 28], [this.cardWidth / 2, 28], [-this.cardWidth / 2, this.cardHeight + 28], [this.cardWidth / 2, this.cardHeight + 28], [-18, -78], [18, -78]];
      const xs = corners.map(([x, y]) => x * cos - y * sin);
      const ys = corners.map(([x, y]) => x * sin + y * cos);
      const minX = 12 - Math.min(...xs), maxX = this.width - 12 - Math.max(...xs);
      const minY = 40 - Math.min(...ys), maxY = this.height - 64 - Math.max(...ys);
      const x = clamp(this.x, minX, Math.max(minX, maxX));
      const y = clamp(this.y, minY, Math.max(minY, maxY));
      if (x !== this.x) this.vx *= -0.12;
      if (y !== this.y) this.vy *= -0.12;
      this.x = x; this.y = y;
    }
    drag(x, y, dt) {
      const oldX = this.x, oldY = this.y;
      this.x = x; this.y = y;
      this.constrain();
      const elapsed = clamp(dt, 0.008, 0.08);
      this.vx = clamp((this.x - oldX) / elapsed, -1000, 1000);
      this.vy = clamp((this.y - oldY) / elapsed, -1000, 1000);
    }
    step(seconds) {
      const steps = Math.max(1, Math.ceil(Math.min(seconds, 0.05) / (1 / 120)));
      const dt = Math.min(seconds, 0.05) / steps;
      for (let i = 0; i < steps; i++) {
        const dx = this.x - this.anchor.x, dy = this.y - this.anchor.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const nx = dx / distance, ny = dy / distance;
        const radialSpeed = this.vx * nx + this.vy * ny;
        // A fabric strap carries tension, but goes slack when pushed toward its anchor.
        const tension = Math.max(0, this.stiffness * (distance - this.length) + 7 * radialSpeed);
        const ax = -tension * nx - 2.7 * this.vx;
        const ay = this.gravity - tension * ny - 2.7 * this.vy;
        this.vx += ax * dt; this.vy += ay * dt;
        this.x += this.vx * dt; this.y += this.vy * dt;
        const lever = Math.max(100, this.cardHeight / 2 + 28);
        const angularAcceleration = -(this.gravity / lever) * Math.sin(this.angle) - 0.18 * (ax / lever) * Math.cos(this.angle) - 5.5 * this.angularVelocity;
        this.angularVelocity += angularAcceleration * dt;
        this.angle += this.angularVelocity * dt;
        if (Math.abs(this.angle) > this.maxAngle) this.angularVelocity *= -0.1;
        this.constrain();
      }
      return Math.hypot(this.vx, this.vy) > 1.2 || Math.abs(this.x - this.anchor.x) > 0.3 || Math.abs(this.y - this.anchor.y - this.length - this.gravity / this.stiffness) > 0.3 || Math.abs(this.angle) > 0.003 || Math.abs(this.angularVelocity) > 0.008;
    }
  }
  if (typeof module === 'object' && module.exports) { module.exports = { BadgePhysics }; return; }
  const stage = document.querySelector('#badge-scene');
  const card = document.querySelector('#id-badge');
  if (!stage || !card) return;
  const rope = document.querySelector('#badge-lanyard');
  const selectPaths = ids => ids.map(id => document.querySelector('#' + id));
  const paths = selectPaths(['lanyard-edge', 'lanyard-fabric', 'lanyard-stitch']);
  const rightPaths = selectPaths(['lanyard-right-edge', 'lanyard-right-fabric', 'lanyard-right-stitch']);
  const loopPaths = selectPaths(['lanyard-loop-edge', 'lanyard-loop-fabric', 'lanyard-loop-stitch']);
  const tailPaths = selectPaths(['lanyard-tail-edge', 'lanyard-tail-fabric', 'lanyard-tail-stitch']);
  const buckle = document.querySelector('#lanyard-buckle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let model, frame = 0, previousTime = 0, dragging = null;
  function render() {
    card.style.left = '0'; card.style.top = '0';
    card.style.transform = `translate3d(${model.x - model.cardWidth / 2}px,${model.y + 28}px,0) rotate(${model.angle}rad)`;
    const dx = model.x - model.anchor.x, dy = model.y - model.anchor.y;
    const slack = Math.max(0, model.length - Math.hypot(dx, dy));
    const bend = clamp(-model.vx * 0.025, -18, 18);
    const shoulder = Math.min(42, model.width * 0.13);
    const joinY = model.y - 74;
    const controlY = 38 + (joinY - 38) * 0.53 + slack * 0.14;
    const leftControlX = model.anchor.x - shoulder * 0.72 + dx * 0.28 + bend;
    const rightControlX = model.anchor.x + shoulder * 0.72 + dx * 0.28 + bend;
    const left = `M${model.anchor.x - shoulder} 38 Q${leftControlX} ${controlY} ${model.x - 5} ${joinY}`;
    const right = `M${model.x + 5} ${joinY} Q${rightControlX} ${controlY} ${model.anchor.x + shoulder} 38`;
    const loop = `M${model.anchor.x - shoulder} 38 C${model.anchor.x - shoulder} 4 ${model.anchor.x + shoulder} 4 ${model.anchor.x + shoulder} 38`;
    const tail = `M${model.x} ${model.y - 34} Q${model.x + bend * 0.15} ${model.y - 15} ${model.x} ${model.y}`;
    paths.forEach(path => path.setAttribute('d', left));
    rightPaths.forEach(path => path.setAttribute('d', right));
    loopPaths.forEach(path => path.setAttribute('d', loop));
    tailPaths.forEach(path => path.setAttribute('d', tail));
    buckle.setAttribute('transform', `translate(${model.x} ${model.y - 56})`);
  }
  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
  function animate(time) {
    frame = 0;
    const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 1 / 60;
    previousTime = time;
    if (dragging || document.hidden || reducedMotion.matches) return;
    const moving = model.step(dt);
    render();
    if (moving) frame = requestAnimationFrame(animate);
    else { model.reset(); render(); previousTime = 0; }
  }
  function start() { if (!frame && !dragging && !reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(animate); }
  function endDrag(event, cancelled = false) {
    if (!dragging || (event && event.pointerId !== dragging.id)) return;
    const id = dragging.id;
    if (cancelled || performance.now() - dragging.time > 100) { model.vx = 0; model.vy = 0; }
    dragging = null;
    card.classList.remove('is-dragging');
    if (card.hasPointerCapture(id)) card.releasePointerCapture(id);
    if (reducedMotion.matches) { model.reset(); render(); } else start();
  }
  function resize() {
    stop();
    if (dragging) endDrag(null, true);
    stop();
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height) return;
    if (model) model.resize(width, height, card.offsetWidth, card.offsetHeight);
    else model = new BadgePhysics(width, height, card.offsetWidth, card.offsetHeight);
    rope.setAttribute('viewBox', `0 0 ${width} ${height}`);
    render();
  }
  card.addEventListener('pointerdown', event => {
    if (!model || dragging || !event.isPrimary || event.button !== 0) return;
    const bounds = stage.getBoundingClientRect();
    stop();
    dragging = { id: event.pointerId, dx: event.clientX - bounds.left - model.x, dy: event.clientY - bounds.top - model.y, time: performance.now() };
    model.vx = 0; model.vy = 0;
    card.classList.add('is-dragging');
    card.setPointerCapture(event.pointerId);
    card.focus({ preventScroll: true });
    event.preventDefault();
  });
  card.addEventListener('pointermove', event => {
    if (!dragging || event.pointerId !== dragging.id) return;
    const now = performance.now(), bounds = stage.getBoundingClientRect();
    model.drag(event.clientX - bounds.left - dragging.dx, event.clientY - bounds.top - dragging.dy, (now - dragging.time) / 1000);
    if (!reducedMotion.matches) model.angle = clamp(model.vx * 0.00022, -model.maxAngle, model.maxAngle);
    model.constrain();
    dragging.time = now;
    render();
  });
  card.addEventListener('pointerup', event => endDrag(event));
  card.addEventListener('pointercancel', event => endDrag(event, true));
  card.addEventListener('lostpointercapture', event => endDrag(event, true));
  card.addEventListener('dragstart', event => event.preventDefault());
  card.addEventListener('keydown', event => {
    if (!model || dragging || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'Escape'].includes(event.key)) return;
    event.preventDefault(); stop();
    if (event.key === 'Home' || event.key === 'Escape') model.reset();
    else {
      if (event.key === 'ArrowLeft') model.x -= 18;
      if (event.key === 'ArrowRight') model.x += 18;
      if (event.key === 'ArrowUp') model.y -= 18;
      if (event.key === 'ArrowDown') model.y += 18;
      model.vx = 0; model.vy = 0; model.constrain();
    }
    render();
    start();
  });
  window.addEventListener('blur', () => { endDrag(null, true); stop(); if (model) { model.reset(); render(); } });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { endDrag(null, true); stop(); if (model) { model.reset(); render(); } }
  });
  reducedMotion.addEventListener('change', () => { endDrag(null, true); stop(); if (model) { model.reset(); render(); } });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);
  resize();
}());
