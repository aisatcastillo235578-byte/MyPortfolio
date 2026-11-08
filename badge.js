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
      // Rest higher, with usable travel above and below the ID on every screen.
      const topRest = 40 + 78;
      const bottomRest = height - cardHeight - 28 - 64;
      const restY = topRest + Math.max(0, bottomRest - topRest) * 0.4;
      this.length = Math.max(45, restY - this.anchor.y - this.gravity / this.stiffness);
      this.maxAngle = Math.min(0.38, Math.atan2(Math.max(0, width - cardWidth - 32), cardHeight + 28));
      this.reset();
    }
    reset() {
      this.freeMotion = false;
      this.x = this.anchor.x; this.y = this.anchor.y + this.length + this.gravity / this.stiffness;
      this.vx = 0; this.vy = 0; this.angle = 0; this.angularVelocity = 0;
      this.constrain();
    }
    constrain() {
      this.angle = clamp(this.angle, -this.maxAngle, this.maxAngle);
      // During a pull and its rebound, the card can leave the hero stage.
      if (this.freeMotion) return;
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
        // Keep the release springy, with enough damping to come to rest.
        const tension = Math.max(0, this.stiffness * (distance - this.length) + 3.8 * radialSpeed);
        const pull = this.freeMotion ? Math.min(tension, 9000) : tension;
        const ax = -pull * nx - 1.8 * this.vx;
        const ay = this.gravity - pull * ny - 1.8 * this.vy;
        this.vx += ax * dt; this.vy += ay * dt;
        this.x += this.vx * dt; this.y += this.vy * dt;
        const lever = Math.max(100, this.cardHeight / 2 + 28);
        const angularAcceleration = -(this.gravity / lever) * Math.sin(this.angle) - 0.18 * (ax / lever) * Math.cos(this.angle) - 3.6 * this.angularVelocity;
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
  const printedPanel = document.querySelector('#lanyard-right-panel');
  const degreeLabel = document.querySelector('#lanyard-degree');
  const printedIcons = selectPaths(['lanyard-icon-html', 'lanyard-icon-css', 'lanyard-icon-js', 'lanyard-icon-php', 'lanyard-icon-mysql']);
  const printedStripes = selectPaths(['lanyard-stripe-lower', 'lanyard-stripe-upper']);
  const tailPaths = selectPaths(['lanyard-tail-edge', 'lanyard-tail-fabric', 'lanyard-tail-stitch']);
  const buckle = document.querySelector('#lanyard-buckle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let model, frame = 0, previousTime = 0, dragging = null;
  function enableFreeMotion() {
    model.freeMotion = true;
    stage.classList.add('is-free');
    document.documentElement.classList.add('badge-active');
  }
  function resetBadge() {
    model.reset();
    stage.classList.remove('is-free');
    document.documentElement.classList.remove('badge-active');
    render();
  }
  function render() {
    card.style.left = '0'; card.style.top = '0';
    card.style.transform = `translate3d(${model.x - model.cardWidth / 2}px,${model.y + 28}px,0) rotate(${model.angle}rad)`;
    const dx = model.x - model.anchor.x, dy = model.y - model.anchor.y;
    const slack = Math.max(0, model.length - Math.hypot(dx, dy));
    const bend = clamp(-model.vx * 0.025, -18, 18);
    const bounce = clamp(model.vy * 0.035, -14, 14);
    // Broad, gently sagging straps meet at the clip, as in the reference.
    // The ends start outside the clipped stage, so no pin or round cap is visible.
    const inset = 20;
    const leftAnchor = inset;
    const rightAnchor = model.width - inset;
    const topY = -12;
    const joinY = model.y - 74;
    const controlY = joinY + 12 + slack * 0.25 + bounce;
    const leftControlX = (leftAnchor + model.x - 5) * 0.5 + bend;
    const rightControlX = (rightAnchor + model.x + 5) * 0.5 + bend;
    const left = `M${leftAnchor} ${topY} Q${leftControlX} ${controlY} ${model.x - 5} ${joinY}`;
    const right = `M${model.x + 5} ${joinY} Q${rightControlX} ${controlY} ${rightAnchor} ${topY}`;
    const tail = `M${model.x} ${model.y - 34} Q${model.x + bend * 0.15} ${model.y - 15} ${model.x} ${model.y}`;
    paths.forEach(path => path.setAttribute('d', left));
    rightPaths.forEach(path => path.setAttribute('d', right));
    tailPaths.forEach(path => path.setAttribute('d', tail));
    // Keep the printed panel, logos and diagonal bands attached to the bending fabric.
    const point = (a, b, c, t) => ({ x: (1-t)*(1-t)*a.x + 2*(1-t)*t*b.x + t*t*c.x, y: (1-t)*(1-t)*a.y + 2*(1-t)*t*b.y + t*t*c.y });
    const length = (a, b, c) => {
      let total = 0, previous = a;
      for (let i = 1; i <= 24; i++) { const next = point(a,b,c,i/24); total += Math.hypot(next.x-previous.x,next.y-previous.y); previous = next; }
      return total;
    };
    const a = { x:model.x+5, y:joinY }, b = { x:rightControlX, y:controlY }, c = { x:rightAnchor, y:topY };
    const rightLength = length(a,b,c);
    printedPanel.setAttribute('d', right);
    printedPanel.setAttribute('stroke-dasharray', `${rightLength*0.66} ${rightLength}`);
    printedPanel.setAttribute('stroke-dashoffset', -rightLength*0.18);
    degreeLabel.setAttribute('textLength', length({x:leftAnchor,y:topY},{x:leftControlX,y:controlY},{x:model.x-5,y:joinY})*0.74);
    const positionPrint = (node,t) => {
      const p = point(a,b,c,t);
      const angle = Math.atan2(2*(1-t)*(b.y-a.y)+2*t*(c.y-b.y),2*(1-t)*(b.x-a.x)+2*t*(c.x-b.x))*180/Math.PI;
      node.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${angle})`);
    };
    printedIcons.forEach((icon,i) => positionPrint(icon,0.27+i*0.115));
    printedStripes.forEach((stripe,i) => positionPrint(stripe,i ? 0.84 : 0.18));
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
    else { resetBadge(); previousTime = 0; }
  }
  function start() { if (!frame && !dragging && !reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(animate); }
  function endDrag(event, cancelled = false) {
    if (!dragging || (event && event.pointerId !== dragging.id)) return;
    const id = dragging.id;
    if (cancelled || performance.now() - dragging.time > 100) { model.vx = 0; model.vy = 0; }
    dragging = null;
    card.classList.remove('is-dragging');
    if (card.hasPointerCapture(id)) card.releasePointerCapture(id);
    if (reducedMotion.matches) resetBadge(); else start();
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
    resetBadge();
  }
  card.addEventListener('pointerdown', event => {
    if (!model || dragging || !event.isPrimary || event.button !== 0) return;
    const bounds = stage.getBoundingClientRect();
    stop();
    enableFreeMotion();
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
    if (!reducedMotion.matches) {
      // A small drag tilt leaves room to pull toward either side of the stage.
      const dragAngle = Math.min(0.12, model.maxAngle);
      model.angle = clamp(model.vx * 0.00009, -dragAngle, dragAngle);
    }
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
    if (event.key === 'Home' || event.key === 'Escape') resetBadge();
    else {
      enableFreeMotion();
      if (event.key === 'ArrowLeft') model.x -= 18;
      if (event.key === 'ArrowRight') model.x += 18;
      if (event.key === 'ArrowUp') model.y -= 18;
      if (event.key === 'ArrowDown') model.y += 18;
      model.vx = 0; model.vy = 0; model.constrain();
    }
    render();
    start();
  });
  window.addEventListener('blur', () => { endDrag(null, true); stop(); if (model) resetBadge(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { endDrag(null, true); stop(); if (model) resetBadge(); }
  });
  reducedMotion.addEventListener('change', () => { endDrag(null, true); stop(); if (model) resetBadge(); });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);
  resize();
}());
