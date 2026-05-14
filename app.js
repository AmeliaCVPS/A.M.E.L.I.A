(function () {
  "use strict";

  function initVitalsLoop() {
    const start = performance.now();
    const nodes = {
      heart: Array.from(document.querySelectorAll('[data-vital="heart-rate"]')),
      spo2: Array.from(document.querySelectorAll('[data-vital="spo2"]')),
      temp: Array.from(document.querySelectorAll('[data-vital="temperature"]')),
    };

    function setNodes(list, value) {
      for (const el of list) el.textContent = value;
    }

    function update(now) {
      if (!document.hidden && document.getElementById("screen-painel")?.classList.contains("active")) {
        const t = (now - start) / 1000;
        const heart = Math.round(78 + Math.sin(t * 1.4) * 3 + Math.sin(t * 0.37) * 2);
        const spo2 = Math.round(98 + Math.sin(t * 0.7) * 0.6);
        const temp = (36.7 + Math.sin(t * 0.28) * 0.12).toFixed(1);

        setNodes(nodes.heart, heart);
        setNodes(nodes.spo2, spo2);
        setNodes(nodes.temp, temp);
      }

      window.setTimeout(() => requestAnimationFrame(update), 650);
    }

    requestAnimationFrame(update);
  }

  function initPointerGlow() {
    document.querySelectorAll(".vital-tile, .ai-monitor, .panel, .chat-wrap, .vital-visual").forEach((el) => {
      let ticking = false;
      let nextX = 0;
      let nextY = 0;

      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        nextX = event.clientX - rect.left;
        nextY = event.clientY - rect.top;
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          el.style.setProperty("--mx", `${nextX}px`);
          el.style.setProperty("--my", `${nextY}px`);
          ticking = false;
        });
      }, { passive: true });
    });
  }

  function shouldUseLiteEffects() {
    return Boolean(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      (navigator.connection && navigator.connection.saveData) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      window.innerWidth < 760
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("amelia-canvas-ready");
    document.body.classList.toggle("perf-lite", shouldUseLiteEffects());
    initVitalsLoop();
    initPointerGlow();
  });
})();
