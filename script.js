// hunch — waitlist form handling

document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('waitlist-form');
const status = document.getElementById('form-status');

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const endpoint = form.getAttribute('action') || '';
  const email = form.email.value.trim();

  if (!email) return;

  // If the Formspree endpoint hasn't been swapped in yet, don't send a
  // request that will just fail — tell whoever's testing the page.
  if (endpoint.includes('YOUR_FORM_ID')) {
    status.textContent = "waitlist isn't wired up yet — add your Formspree endpoint in index.html.";
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  status.textContent = 'joining…';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    });

    if (res.ok) {
      form.reset();
      status.textContent = "you're on the list. we'll email you when sachets drop.";
    } else {
      status.textContent = 'something went wrong — try again in a bit.';
    }
  } catch (err) {
    status.textContent = 'something went wrong — check your connection and try again.';
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------- scroll-reveal (fade + rise) ----------
// Respects prefers-reduced-motion; degrades to "always visible" without IntersectionObserver.

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll('.reveal');

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
}

// ---------- persistent mobile CTA bar ----------
// Shows once the hero has scrolled out of view; hides again once the real
// waitlist form is on screen so it never covers the thing it points at.

const mobileCta = document.getElementById('mobile-cta');
const heroEl = document.querySelector('.hero');
const waitlistEl = document.getElementById('waitlist');

if (mobileCta && heroEl && waitlistEl && 'IntersectionObserver' in window) {
  let heroVisible = true;
  let waitlistVisible = false;

  const syncBar = () => {
    mobileCta.classList.toggle('is-shown', !heroVisible && !waitlistVisible);
  };

  new IntersectionObserver(
    ([entry]) => {
      heroVisible = entry.isIntersecting;
      syncBar();
    },
    { threshold: 0 }
  ).observe(heroEl);

  new IntersectionObserver(
    ([entry]) => {
      waitlistVisible = entry.isIntersecting;
      syncBar();
    },
    { threshold: 0.15 }
  ).observe(waitlistEl);
}

// ---------- count-up stat numbers ----------
// Animates each "A–Bg" stat from 0 once it scrolls into view. Triggers once.

const statNumbers = document.querySelectorAll('.stat-number[data-count-a]');

function animateStatNumber(el) {
  const a = parseFloat(el.dataset.countA);
  const b = parseFloat(el.dataset.countB);
  const suffix = el.dataset.suffix || '';
  const duration = 900;
  const startTime = performance.now();

  function tick(now) {
    const p = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    const curA = Math.round(a * eased);
    const curB = Math.round(b * eased);
    el.textContent = `${curA}–${curB}${suffix}`;
    if (p < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = `${a}–${b}${suffix}`;
    }
  }

  requestAnimationFrame(tick);
}

// ---------- hero carousel dots ----------
// Syncs the active dot to scroll position (rAF-throttled) and lets dots
// jump to a slide. Only relevant on mobile, where the carousel is visible.

const heroCarousel = document.getElementById('hero-carousel');
const heroDotsWrap = document.getElementById('hero-carousel-dots');

if (heroCarousel && heroDotsWrap) {
  const dots = Array.from(heroDotsWrap.querySelectorAll('.dot'));
  const slides = Array.from(heroCarousel.querySelectorAll('.hero-slide'));

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      slides[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
  });

  heroCarousel.addEventListener(
    'scroll',
    () => {
      const slideWidth = heroCarousel.clientWidth || 1;
      const activeIndex = Math.round(heroCarousel.scrollLeft / slideWidth);
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === activeIndex));
    },
    { passive: true }
  );
}

if (statNumbers.length) {
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    // leave the static markup value as-is
  } else {
    statNumbers.forEach((el) => {
      el.textContent = `0–0${el.dataset.suffix || ''}`;
    });
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateStatNumber(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    statNumbers.forEach((el) => statObserver.observe(el));
  }
}
