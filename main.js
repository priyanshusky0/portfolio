// Parallax: each hero layer moves by its data-depth on scroll and data-sway
// (px) with the pointer; project cards drift by data-drift. One rAF loop.
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const layers = [...document.querySelectorAll(".hero [data-depth]")];
  const cards = [...document.querySelectorAll("[data-drift]")];
  const sign = document.querySelector(".sign");

  // The contact sign lights up once when it scrolls into view
  if (sign && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        sign.classList.add("is-lit");
        io.disconnect();
      }
    }, { threshold: 0.6 });
    io.observe(sign);
  } else if (sign) {
    sign.classList.add("is-lit");
  }

  if (reduce.matches) return;

  let pointerX = 0;
  let pointerY = 0;
  let easedX = 0;
  let easedY = 0;
  let ticking = false;

  window.addEventListener("pointermove", (e) => {
    pointerX = e.clientX / window.innerWidth - 0.5;
    pointerY = e.clientY / window.innerHeight - 0.5;
    request();
  }, { passive: true });
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);

  function request() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(frame);
    }
  }

  function frame() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;

    // Ease the pointer so layers glide instead of snapping
    easedX += (pointerX - easedX) * 0.08;
    easedY += (pointerY - easedY) * 0.08;

    if (y < vh * 1.2) {
      for (const el of layers) {
        const depth = parseFloat(el.dataset.depth);
        const sway = parseFloat(el.dataset.sway || 0);
        const tx = -easedX * sway;
        const ty = y * depth - easedY * sway * 0.5;
        el.style.translate = `${tx}px ${ty}px`;
      }
    }

    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) continue;
      const fromCenter = rect.top + rect.height / 2 - vh / 2;
      card.style.translate = `0 ${fromCenter * parseFloat(card.dataset.drift)}px`;
    }

    // Keep gliding until the eased pointer catches up
    if (Math.abs(pointerX - easedX) > 0.001 || Math.abs(pointerY - easedY) > 0.001) {
      request();
    }
  }

  request();
})();
