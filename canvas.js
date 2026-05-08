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
      const target = reducedMotion ? 26 : clamp(Math.floor(area / 21000), 42, 96);
      this.particles = Array.from({ length: target }, () => {
        const speed = reducedMotion ? 0.015 : 0.045;
        return {
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          r: 1 + Math.random() * 1.8,
          phase: Math.random() * Math.PI * 2,
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
      wash.addColorStop(0, "rgba(91,150,247,0.20)");
      wash.addColorStop(0.42, "rgba(43,120,228,0.08)");
      wash.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, w, h);

      for (const p of this.particles) {
        const dx = this.pointer.x - p.x;
        const dy = this.pointer.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 170) {
          const force = (1 - dist / 170) * 0.015;
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
      const maxDist = reducedMotion ? 105 : 145;
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const a = this.particles[i];
          const b = this.particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > maxDist) continue;
          const alpha = (1 - dist / maxDist) * 0.22;
          ctx.strokeStyle = `rgba(43,120,228,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const p of this.particles) {
        const glow = 0.38 + Math.sin(time * 1.4 + p.phase) * 0.18;
        ctx.fillStyle = `rgba(43,120,228,${glow})`;
        ctx.shadowColor = "rgba(43,120,228,0.55)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class MedicalChart {
    constructor(canvas) {
      this.canvas = canvas;
      this.type = canvas.dataset.canvasChart || "ecg";
      this.running = true;
      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);

      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(this.resize);
        this.resizeObserver.observe(canvas);
      } else {
        window.addEventListener("resize", this.resize, { passive: true });
      }
      this.resize();
      requestAnimationFrame(this.tick);
    }

    resize() {
      const box = resizeCanvas(this.canvas);
      this.ctx = box.ctx;
      this.width = box.width;
      this.height = box.height;
    }

    wave(phase) {
      const p = ((phase % 1) + 1) % 1;
      if (this.type === "ecg") {
        if (p < 0.08) return Math.sin(p / 0.08 * Math.PI) * 0.08;
        if (p < 0.18) return -0.10 * Math.sin((p - 0.08) / 0.10 * Math.PI);
        if (p < 0.24) return 0.96 * Math.sin((p - 0.18) / 0.06 * Math.PI);
        if (p < 0.31) return -0.24 * Math.sin((p - 0.24) / 0.07 * Math.PI);
        if (p < 0.58) return 0.18 * Math.sin((p - 0.31) / 0.27 * Math.PI);
        return 0;
      }
      if (this.type === "oxygen") {
        return Math.sin(p * Math.PI * 2) * 0.28 + Math.sin(p * Math.PI * 4) * 0.05;
      }
      if (this.type === "temp") {
        return Math.sin(p * Math.PI * 2) * 0.13 + Math.cos(p * Math.PI * 6) * 0.035;
      }
      return Math.sin(p * Math.PI * 2) * 0.24 + Math.sin((p + 0.2) * Math.PI * 8) * 0.08;
    }

    tick(now) {
      if (!document.hidden) this.draw(now * 0.001);
      requestAnimationFrame(this.tick);
    }

    draw(time) {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.strokeStyle = "rgba(43,120,228,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const speed = reducedMotion ? 0.12 : 0.42;
      const amplitude = this.type === "ecg" ? 0.34 : 0.28;
      const center = h * 0.52;
      const color = this.type === "temp" ? "234,179,8" : "43,120,228";

      ctx.shadowColor = `rgba(${color},0.45)`;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = `rgba(${color},0.92)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const phase = x / 118 - time * speed;
        const y = center - this.wave(phase) * h * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const scanX = ((time * 48) % (w + 80)) - 40;
      const gradient = ctx.createLinearGradient(scanX - 30, 0, scanX + 30, 0);
      gradient.addColorStop(0, "rgba(91,150,247,0)");
      gradient.addColorStop(0.5, "rgba(91,150,247,0.26)");
      gradient.addColorStop(1, "rgba(91,150,247,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(scanX - 30, 0, 60, h);
      ctx.restore();
    }
  }

  function initCanvas() {
    const bg = document.getElementById("neural-bg");
    if (bg) new NeuralBackground(bg);
    document.querySelectorAll("[data-canvas-chart]").forEach((canvas) => {
      new MedicalChart(canvas);
    });
  }

  window.AmeliaCanvas = { initCanvas, NeuralBackground, MedicalChart };
  document.addEventListener("DOMContentLoaded", initCanvas);
})();
