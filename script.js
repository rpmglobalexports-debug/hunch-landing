// hunch — waitlist form handling

document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('waitlist-form');
const status = document.getElementById('form-status');
const signupBlock = document.getElementById('waitlist-signup');
const thanksBlock = document.getElementById('waitlist-thanks');

// ---------- ad attribution: carry utm_* into the hidden form fields ----------
// Persisted in sessionStorage so a visitor who lands with UTMs and scrolls/reloads
// still submits with them. Storage can throw (private mode), so it's best-effort.

['utm_source', 'utm_campaign', 'utm_content'].forEach(function (key) {
  const field = form.elements[key];
  if (!field) return;
  let value = new URLSearchParams(window.location.search).get(key);
  try {
    if (value) {
      sessionStorage.setItem(key, value);
    } else {
      value = sessionStorage.getItem(key);
    }
  } catch (err) {}
  field.value = value || '';
});

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
  status.classList.remove('is-error');
  status.textContent = 'joining…';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    });

    if (res.ok) {
      // Tracking must never turn a successful signup into an error message.
      try {
        if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
      } catch (trackErr) {}
      form.reset();
      status.textContent = '';
      signupBlock.hidden = true;
      thanksBlock.hidden = false;
      thanksBlock.focus();
    } else {
      status.classList.add('is-error');
      status.textContent = 'something went wrong — try again in a bit.';
    }
  } catch (err) {
    status.classList.add('is-error');
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

// ---------- hero carousel: dots + true infinite loop ----------
// Only runs on mobile, where the carousel is the visible hero. Clones slide 1
// to the end and the last slide to the start, so swiping past either edge
// keeps showing real content; once the browser settles scroll on a clone
// (native 'scrollend'), we instantly (no visible transition) reset scrollLeft
// to the matching real slide - imperceptible since the clone is identical.

const heroCarousel = document.getElementById('hero-carousel');
const heroDotsWrap = document.getElementById('hero-carousel-dots');
const heroVisualEl = document.getElementById('hero-visual');
const isMobileHero = heroVisualEl && heroVisualEl.classList.contains('is-mobile-hero');

if (heroCarousel && heroDotsWrap && isMobileHero) {
  const dots = Array.from(heroDotsWrap.querySelectorAll('.dot'));
  const slides = Array.from(heroCarousel.querySelectorAll('.hero-slide'));
  const realCount = slides.length;

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      slides[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
  });

  let cloneOffset = 0; // shifts scroll-position -> dot-index math once clones exist

  if (realCount > 1) {
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[realCount - 1].cloneNode(true);
    firstClone.setAttribute('aria-hidden', 'true');
    lastClone.setAttribute('aria-hidden', 'true');
    // The brand overlay (eyebrow/h1/CTA) only belongs on the real slide 1.
    const staleOverlay = firstClone.querySelector('.hero-brand-overlay');
    if (staleOverlay) staleOverlay.remove();
    heroCarousel.appendChild(firstClone);
    heroCarousel.insertBefore(lastClone, slides[0]);
    cloneOffset = 1;
    heroCarousel.scrollLeft = heroCarousel.clientWidth * cloneOffset;

    if ('onscrollend' in window) {
      heroCarousel.addEventListener('scrollend', () => {
        const w = heroCarousel.clientWidth || 1;
        const idx = Math.round(heroCarousel.scrollLeft / w);
        if (idx === 0) {
          heroCarousel.scrollLeft = w * realCount; // clone-of-last -> real last
        } else if (idx === realCount + 1) {
          heroCarousel.scrollLeft = w * cloneOffset; // clone-of-first -> real first
        }
      });
    }
  }

  heroCarousel.addEventListener(
    'scroll',
    () => {
      const w = heroCarousel.clientWidth || 1;
      let idx = Math.round(heroCarousel.scrollLeft / w) - cloneOffset;
      if (idx < 0) idx = realCount - 1;
      if (idx > realCount - 1) idx = 0;
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === idx));
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
