// Smooth scrolling (Lenis), hero parallax, and the pinned horizontal
// projects track. Everything reads window.scrollY in one rAF-driven update.
(() => {
  const root = document.documentElement;
  root.classList.add("js");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = window.matchMedia("(max-width: 700px)");

  const layers = [...document.querySelectorAll(".hero [data-depth]")];
  const nameLines = [...document.querySelectorAll(".hero [data-split]")];
  const projects = document.querySelector(".projects");
  const track = document.querySelector(".projects-track");
  const framed = [...document.querySelectorAll("[data-parallax]")];
  const shots = [...document.querySelectorAll("[data-speed]")];
  const wide = window.matchMedia("(min-width: 901px)");

  // Click a photo or certificate to see it full size
  const lightbox = document.querySelector(".lightbox");
  if (lightbox && lightbox.showModal) {
    const big = lightbox.querySelector("img");
    document.querySelectorAll("a.zoom").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const img = a.querySelector("img");
        big.src = a.getAttribute("href");
        big.alt = img ? img.alt : a.textContent;
        lightbox.showModal();
      });
    });
    lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.close(); });
  }

  // Start the load sequence once fonts are in, so the name doesn't reflow
  const start = () => document.body.classList.add("is-loaded");
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(start));
  } else {
    start();
  }

  // Pinned section height = horizontal travel + one screen
  function sizeProjects() {
    if (phone.matches || reduce) {
      projects.style.height = "";
      track.style.transform = "";
      return;
    }
    const travel = track.scrollWidth - window.innerWidth;
    projects.style.height = `${travel + window.innerHeight}px`;
  }

  let pointerX = 0;
  let pointerY = 0;
  let easedX = 0;
  let easedY = 0;

  function update() {
    const y = window.scrollY;
    const vh = window.innerHeight;

    easedX += (pointerX - easedX) * 0.07;
    easedY += (pointerY - easedY) * 0.07;

    if (y < vh * 1.2) {
      for (const el of layers) {
        const depth = parseFloat(el.dataset.depth);
        const sway = parseFloat(el.dataset.sway || 0);
        el.style.translate = `${-easedX * sway}px ${y * depth - easedY * sway * 0.4}px`;
      }
      // The two halves of the name slide apart as you scroll away
      for (const el of nameLines) {
        el.style.translate = `${parseFloat(el.dataset.split) * y * 0.45}px 0`;
      }
    }

    // Photos slide a little inside their frames as they pass through view
    for (const img of framed) {
      const rect = img.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) continue;
      const progress = (vh - rect.top) / (vh + rect.height);
      img.style.transform = `translate3d(0, ${-progress * 13}%, 0)`;
    }

    // Collage photos move at different speeds, so they seem to sit at different depths
    for (const el of shots) {
      if (!wide.matches || reduce) { el.style.translate = ""; continue; }
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) continue;
      const fromCenter = rect.top + rect.height / 2 - vh / 2;
      el.style.translate = `0 ${fromCenter * parseFloat(el.dataset.speed)}px`;
    }

    if (!phone.matches) {
      const top = projects.offsetTop;
      const travel = track.scrollWidth - window.innerWidth;
      const progress = Math.min(Math.max((y - top) / Math.max(travel, 1), 0), 1);
      track.style.transform = `translate3d(${-progress * travel}px, 0, 0)`;
    }
  }

  sizeProjects();
  window.addEventListener("resize", () => { sizeProjects(); update(); });
  phone.addEventListener("change", () => { sizeProjects(); update(); });

  if (reduce) {
    window.addEventListener("scroll", update, { passive: true });
    update();
    return;
  }

  window.addEventListener("pointermove", (e) => {
    pointerX = e.clientX / window.innerWidth - 0.5;
    pointerY = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
    // Anchor links go through Lenis so they glide too
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const target = document.querySelector(a.getAttribute("href"));
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target);
        }
      });
    });
  }

  function frame(time) {
    if (lenis) lenis.raf(time);
    update();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
