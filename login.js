import { api, setSession } from '../api.js';
import { el } from '../ui.js';

export function renderLogin() {
  const root = el(`
    <div class="auth-card">
      <h1>Staff sign in</h1>
      <p class="lead">Sign in to the Tshedimoso administration portal.</p>
      <form id="login-form">
        <div class="field">
          <label for="email">Email</label>
          <input type="email" id="email" required autocomplete="username" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input type="password" id="password" required autocomplete="current-password" />
        </div>
        <div class="field-error" id="login-error" style="display:none;"></div>
        <button type="submit" class="btn btn-primary" style="width:100%;" id="login-submit">Sign in</button>
      </form>
    </div>
  `);

  const form = root.querySelector('#login-form');
  const errorEl = root.querySelector('#login-error');
  const submitBtn = root.querySelector('#login-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in\u2026';

    const email = root.querySelector('#email').value.trim();
    const password = root.querySelector('#password').value;

    try {
      const result = await api.login(email, password);
      setSession(result.token, result.user);
      if (result.user.mfaEnabled) {
        // SEC-007: a real deployment would prompt for a second factor here
        // before establishing the session. This demo flags it instead of
        // implementing a specific MFA provider.
        console.info('MFA is required for this account in production — not enforced in this demo.');
      }
      window.location.hash = '#/portal/overview';
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign in';
    }
  });

  return root;
}
