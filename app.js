(function () {
  "use strict";

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
    });
  }

  function initVitalsLoop() {
    const start = performance.now();

    function update(now) {
      const t = (now - start) / 1000;
      const heart = Math.round(78 + Math.sin(t * 1.4) * 3 + Math.sin(t * 0.37) * 2);
      const spo2 = Math.round(98 + Math.sin(t * 0.7) * 0.6);
      const temp = (36.7 + Math.sin(t * 0.28) * 0.12).toFixed(1);

      setText('[data-vital="heart-rate"]', heart);
      setText('[data-vital="spo2"]', spo2);
      setText('[data-vital="temperature"]', temp);

      requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  function initPointerGlow() {
    document.querySelectorAll(".vital-tile, .ai-monitor, .panel, .chat-wrap").forEach((el) => {
      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        el.style.setProperty("--my", `${event.clientY - rect.top}px`);
      }, { passive: true });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("amelia-canvas-ready");
    initVitalsLoop();
    initPointerGlow();
  });
})();
