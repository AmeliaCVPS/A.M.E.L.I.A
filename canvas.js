(function () {
  "use strict";

  const DPR_CAP = 2;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width || window.innerWidth);
    const height = Math.max(1, rect.height || window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width, height, dpr };
  }

  class NeuralBackground {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.particles = [];
      this.pointer = { x: -9999, y: -9999 };
      this.running = true;
      this.last = 0;

      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);
      this.handlePointer = this.handlePointer.bind(this);

      window.addEventListener("resize", this.resize, { passive: true });
      window.addEventListener("pointermove", this.handlePointer, { passive: true });
      window.addEventListener("pointerleave", () => {
        this.pointer.x = -9999;
        this.pointer.y = -9999;
      }, { passive: true });
      document.addEventListener("visibilitychange", () => {
        this.running = !document.hidden;
        if (this.running) requestAnimationFrame(this.tick);
      });

      this.resize();
      requestAnimationFrame(this.tick);
    }

    handlePointer(event) {
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
    }

    resize() {
      const box = resizeCanvas(this.canvas);
      this.ctx = box.ctx;
      this.width = box.width;
      this.height = box.height;
      this.createParticles();
    }

    createParticles() {
      const area = this.width * this.height;
      const target = reducedMotion ? 34 : clamp(Math.floor(area / 11500), 74, 160);
      const neuralHues = [214, 196, 176, 154];
      this.particles = Array.from({ length: target }, () => {
        const speed = reducedMotion ? 0.016 : 0.052;
        return {
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          r: 1.15 + Math.random() * 2.15,
          phase: Math.random() * Math.PI * 2,
          hue: neuralHues[Math.floor(Math.random() * neuralHues.length)],
        };
      });
    }

    tick(now) {
      if (!this.running) return;
      const dt = Math.min(40, now - (this.last || now));
      this.last = now;
      this.draw(now * 0.001, dt);
      requestAnimationFrame(this.tick);
    }

    draw(time, dt) {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      ctx.clearRect(0, 0, w, h);

      const wash = ctx.createRadialGradient(w * 0.72, h * 0.14, 0, w * 0.72, h * 0.14, Math.max(w, h) * 0.72);
      wash.addColorStop(0, "rgba(91,150,247,0.28)");
      wash.addColorStop(0.42, "rgba(43,120,228,0.13)");
      wash.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, w, h);

      const secondaryWash = ctx.createRadialGradient(w * 0.16, h * 0.78, 0, w * 0.16, h * 0.78, Math.max(w, h) * 0.62);
      secondaryWash.addColorStop(0, "rgba(22,163,74,0.16)");
      secondaryWash.addColorStop(0.48, "rgba(43,120,228,0.08)");
      secondaryWash.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = secondaryWash;
      ctx.fillRect(0, 0, w, h);

      for (const p of this.particles) {
        const dx = this.pointer.x - p.x;
        const dy = this.pointer.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 210) {
          const force = (1 - dist / 210) * 0.018;
          p.vx -= (dx / Math.max(dist, 1)) * force;
          p.vy -= (dy / Math.max(dist, 1)) * force;
        }

        p.x += p.vx * dt + Math.sin(time + p.phase) * 0.012 * dt;
        p.y += p.vy * dt + Math.cos(time * 0.8 + p.phase) * 0.01 * dt;
        p.vx *= 0.996;
        p.vy *= 0.996;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const maxDist = reducedMotion ? 130 : 190;
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const a = this.particles[i];
          const b = this.particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > maxDist) continue;
          const alpha = (1 - dist / maxDist) * 0.34;
          const hue = Math.round((a.hue + b.hue) / 2);
          ctx.strokeStyle = `hsla(${hue},82%,48%,${alpha})`;
          ctx.lineWidth = 1.08;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const p of this.particles) {
        const glow = 0.46 + Math.sin(time * 1.4 + p.phase) * 0.22;
        ctx.fillStyle = `hsla(${p.hue},82%,50%,${glow})`;
        ctx.shadowColor = `hsla(${p.hue},82%,52%,0.68)`;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function initCanvas() {
    const bg = document.getElementById("neural-bg");
    if (bg) new NeuralBackground(bg);
  }

  window.AmeliaCanvas = { initCanvas, NeuralBackground };
  document.addEventListener("DOMContentLoaded", initCanvas);
})();
