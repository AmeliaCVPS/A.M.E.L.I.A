/* A.M.E.L.I.A. — Main JS — Totem de Triagem */

// ── Auto-dismiss flash messages ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const flashOverlay = document.getElementById('flashOverlay');
  if (flashOverlay) {
    setTimeout(() => {
      flashOverlay.style.transition = 'opacity .5s';
      flashOverlay.style.opacity = '0';
      setTimeout(() => flashOverlay.remove(), 500);
    }, 4500);
  }

  // Animate stat values in admin
  document.querySelectorAll('.stat-value').forEach(el => {
    const target = parseInt(el.textContent);
    if (isNaN(target) || target === 0) return;
    let count = 0;
    const step = Math.ceil(target / 20);
    const timer = setInterval(() => {
      count = Math.min(count + step, target);
      el.textContent = count;
      if (count >= target) clearInterval(timer);
    }, 40);
  });

  // Animate AI bar fill on senha page
  document.querySelectorAll('.ai-bar-fill').forEach(bar => {
    const w = bar.style.width;
    bar.style.width = '0%';
    requestAnimationFrame(() => {
      setTimeout(() => { bar.style.width = w; }, 100);
    });
  });

  // Animate mini bars in admin table
  document.querySelectorAll('.mini-bar-fill').forEach(bar => {
    const w = bar.style.width;
    bar.style.width = '0%';
    requestAnimationFrame(() => {
      setTimeout(() => { bar.style.width = w; }, 200);
    });
  });
});

// ── Touch/click ripple on totem buttons ──────────────────────
document.querySelectorAll('.totem-btn, .totem-submit-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect   = this.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      position:absolute;
      width:${size}px;height:${size}px;
      left:${e.clientX-rect.left-size/2}px;
      top:${e.clientY-rect.top-size/2}px;
      background:rgba(255,255,255,.25);
      border-radius:50%;
      transform:scale(0);
      animation:ripple .5s linear;
      pointer-events:none;
    `;
    if(!document.getElementById('rippleStyle')){
      const s = document.createElement('style');
      s.id = 'rippleStyle';
      s.textContent = '@keyframes ripple{to{transform:scale(3);opacity:0}}';
      document.head.appendChild(s);
    }
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});
