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
