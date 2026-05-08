(function () {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const lowCoreDevice = (navigator.hardwareConcurrency || 4) <= 4;
  const lowPower = coarsePointer || lowCoreDevice;
  const DPR_CAP = lowPower ? 1.25 : 1.6;
  const BG_FPS = reducedMotion ? 1 : lowPower ? 24 : 30;
  const CHART_FPS = reducedMotion ? 1 : 24;

  const charts = [];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.round(rect.width || window.innerWidth));
    const cssHeight = Math.max(1, Math.round(rect.height || window.innerHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const width = Math.round(cssWidth * dpr);
    const height = Math.round(cssHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width: cssWidth, height: cssHeight, dpr };
  }

  function scheduleResize(callback) {
    let raf = 0;
    return () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        callback();
      });
    };
  }

  class NeuralLightLeaks {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = null;
      this.width = 1;
      this.height = 1;
      this.particles = [];
      this.pointer = { x: -9999, y: -9999 };
      this.lastFrame = 0;
      this.running = false;
      this.frameInterval = 1000 / BG_FPS;

      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onVisibility = this.onVisibility.bind(this);

      this.resizeHandler = scheduleResize(this.resize);
      window.addEventListener("resize", this.resizeHandler, { passive: true });
      document.addEventListener("visibilitychange", this.onVisibility);

      if (!coarsePointer) {
        window.addEventListener("pointermove", this.onPointerMove, { passive: true });
        window.addEventListener("pointerleave", () => {
          this.pointer.x = -9999;
          this.pointer.y = -9999;
        }, { passive: true });
      }

      this.resize();
      this.start();
    }

    start() {
      if (this.running) return;
      this.running = true;
      requestAnimationFrame(this.tick);
    }

    stop() {
      this.running = false;
    }

    onVisibility() {
      if (document.hidden) {
        this.stop();
      } else {
        this.lastFrame = 0;
        this.start();
      }
    }

    onPointerMove(event) {
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
    }

    resize() {
      const box = resizeCanvas(this.canvas);
      this.ctx = box.ctx;
      this.width = box.width;
      this.height = box.height;
      this.createParticles();
      this.draw(0, 16);
    }

    createParticles() {
      const area = this.width * this.height;
      const min = lowPower ? 24 : 36;
      const max = lowPower ? 48 : 82;
      const density = lowPower ? 36000 : 26000;
      const count = reducedMotion ? 18 : clamp(Math.round(area / density), min, max);

      this.linkDistance = lowPower ? 102 : 132;
      this.particles = Array.from({ length: count }, () => {
        const speed = lowPower ? 0.012 : 0.02;
        return {
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          size: 0.9 + Math.random() * (lowPower ? 1.2 : 1.8),
          phase: Math.random() * Math.PI * 2,
        };
      });
    }

    tick(now) {
      if (!this.running) return;

      if (now - this.lastFrame >= this.frameInterval) {
        const dt = clamp(now - (this.lastFrame || now), 0, 42);
        this.lastFrame = now;
        this.draw(now * 0.001, dt);
      }

      if (!reducedMotion) requestAnimationFrame(this.tick);
    }

    draw(time, dt) {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);
      this.drawLightLeaks(ctx, w, h, time);

      if (!reducedMotion) {
        this.updateParticles(time, dt, w, h);
      }

      this.drawNetwork(ctx, w, h, time);
    }

    drawLightLeaks(ctx, w, h, time) {
      const drift = reducedMotion ? 0 : Math.sin(time * 0.18);
      const leaks = [
        [w * (0.72 + drift * 0.03), h * 0.1, Math.max(w, h) * 0.62, "25,118,232", 0.2],
        [w * 0.12, h * (0.58 - drift * 0.02), Math.max(w, h) * 0.5, "34,199,232", 0.13],
        [w * (0.86 - drift * 0.02), h * 0.78, Math.max(w, h) * 0.44, "23,165,107", 0.08],
      ];

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      leaks.forEach(([x, y, radius, rgb, alpha]) => {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(${rgb},${alpha})`);
        gradient.addColorStop(0.42, `rgba(${rgb},${alpha * 0.35})`);
        gradient.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      });

      const scan = ctx.createLinearGradient(0, 0, w, h);
      scan.addColorStop(0, "rgba(255,255,255,0)");
      scan.addColorStop(0.48, "rgba(255,255,255,0.1)");
      scan.addColorStop(0.52, "rgba(130,189,255,0.18)");
      scan.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = scan;
      ctx.globalAlpha = lowPower ? 0.28 : 0.38;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    updateParticles(time, dt, w, h) {
      const pointerRadius = lowPower ? 118 : 160;
      for (const p of this.particles) {
        if (!coarsePointer) {
          const dx = this.pointer.x - p.x;
          const dy = this.pointer.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < pointerRadius) {
            const force = (1 - dist / pointerRadius) * 0.005;
            p.vx -= (dx / Math.max(dist, 1)) * force;
            p.vy -= (dy / Math.max(dist, 1)) * force;
          }
        }

        p.x += (p.vx + Math.sin(time * 0.7 + p.phase) * 0.004) * dt;
        p.y += (p.vy + Math.cos(time * 0.54 + p.phase) * 0.003) * dt;
        p.vx *= 0.996;
        p.vy *= 0.996;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }
    }

    drawNetwork(ctx, w, h, time) {
      const maxDist = this.linkDistance;
      const maxLinks = this.particles.length * (lowPower ? 2 : 3);
      let links = 0;

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.lineWidth = 1;

      for (let i = 0; i < this.particles.length; i += 1) {
        const a = this.particles[i];
        for (let j = i + 1; j < this.particles.length; j += 1) {
          const b = this.particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > maxDist) continue;

          const alpha = (1 - dist / maxDist) * (lowPower ? 0.12 : 0.2);
          ctx.strokeStyle = `rgba(25,118,232,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          links += 1;
          if (links > maxLinks) break;
        }
        if (links > maxLinks) break;
      }

      for (const p of this.particles) {
        const alpha = 0.34 + Math.sin(time + p.phase) * 0.08;
        ctx.fillStyle = `rgba(25,118,232,${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  class MedicalChart {
    constructor(canvas) {
      this.canvas = canvas;
      this.type = canvas.dataset.canvasChart || "ecg";
      this.ctx = null;
      this.width = 1;
      this.height = 1;
      this.visible = false;
      this.running = false;
      this.lastFrame = 0;
      this.frameInterval = 1000 / CHART_FPS;

      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);
      this.setVisible = this.setVisible.bind(this);

      this.resizeHandler = scheduleResize(this.resize);

      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(this.resizeHandler);
        this.resizeObserver.observe(canvas);
      } else {
        window.addEventListener("resize", this.resizeHandler, { passive: true });
      }

      if (window.IntersectionObserver) {
        this.intersectionObserver = new IntersectionObserver((entries) => {
          this.setVisible(entries.some((entry) => entry.isIntersecting));
        }, { threshold: 0.05 });
        this.intersectionObserver.observe(canvas);
      } else {
        this.setVisible(true);
      }

      document.addEventListener("visibilitychange", () => {
        this.setVisible(this.visible && !document.hidden);
      });

      this.resize();
      this.draw(0);
    }

    setVisible(visible) {
      this.visible = visible;
      if (visible && !document.hidden) {
        this.start();
      } else {
        this.running = false;
      }
    }

    start() {
      if (this.running || reducedMotion) {
        if (reducedMotion) this.draw(0);
        return;
      }
      this.running = true;
      requestAnimationFrame(this.tick);
    }

    resize() {
      const box = resizeCanvas(this.canvas);
      this.ctx = box.ctx;
      this.width = box.width;
      this.height = box.height;
      this.draw(0);
    }

    tick(now) {
      if (!this.running) return;

      if (now - this.lastFrame >= this.frameInterval) {
        this.lastFrame = now;
        this.draw(now * 0.001);
      }

      requestAnimationFrame(this.tick);
    }

    wave(phase) {
      const p = ((phase % 1) + 1) % 1;
      if (this.type === "ecg") {
        if (p < 0.08) return Math.sin((p / 0.08) * Math.PI) * 0.08;
        if (p < 0.18) return -0.1 * Math.sin(((p - 0.08) / 0.1) * Math.PI);
        if (p < 0.24) return 0.94 * Math.sin(((p - 0.18) / 0.06) * Math.PI);
        if (p < 0.31) return -0.24 * Math.sin(((p - 0.24) / 0.07) * Math.PI);
        if (p < 0.58) return 0.18 * Math.sin(((p - 0.31) / 0.27) * Math.PI);
        return 0;
      }
      if (this.type === "oxygen") {
        return Math.sin(p * Math.PI * 2) * 0.26 + Math.sin(p * Math.PI * 4) * 0.04;
      }
      if (this.type === "temp") {
        return Math.sin(p * Math.PI * 2) * 0.12 + Math.cos(p * Math.PI * 6) * 0.03;
      }
      return Math.sin(p * Math.PI * 2) * 0.22;
    }

    draw(time) {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      if (!ctx) return;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(247,251,255,0.9)";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.strokeStyle = "rgba(25,118,232,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const speed = reducedMotion ? 0 : this.type === "ecg" ? 0.42 : 0.28;
      const center = h * 0.52;
      const amplitude = this.type === "ecg" ? 0.34 : 0.28;
      const color = this.type === "temp" ? "216,137,18" : "25,118,232";

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

      if (!lowPower && !reducedMotion) {
        const scanX = ((time * 42) % (w + 60)) - 30;
        const gradient = ctx.createLinearGradient(scanX - 24, 0, scanX + 24, 0);
        gradient.addColorStop(0, "rgba(130,189,255,0)");
        gradient.addColorStop(0.5, "rgba(130,189,255,0.24)");
        gradient.addColorStop(1, "rgba(130,189,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(scanX - 24, 0, 48, h);
      }

      ctx.restore();
    }
  }

  function init() {
    const background = document.getElementById("neural-bg");
    if (background) {
      window.AmeliaBackground = new NeuralLightLeaks(background);
    }

    document.querySelectorAll("[data-canvas-chart]").forEach((canvas) => {
      charts.push(new MedicalChart(canvas));
    });

    document.addEventListener("amelia:screen", () => {
      requestAnimationFrame(() => {
        charts.forEach((chart) => chart.resize());
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  window.AmeliaCanvas = {
    charts,
    resizeAll() {
      charts.forEach((chart) => chart.resize());
    },
  };
})();
