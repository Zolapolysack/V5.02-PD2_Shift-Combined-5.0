# Login V2.0 (Neumorphism)

Self-contained neumorphic login UI with a client-side quick-gate (not for sensitive data). Ready to drop into a static site (e.g., GitHub Pages) and to guard other modules.

## What’s included
- `forms/neumorphism/index.html` — login page
- `forms/neumorphism/style.css` — neumorphism styles
- `forms/neumorphism/script.js` — UI logic and success flow (redirect honors `?next=`)
- `forms/neumorphism/auth.js` — client-side auth (SHA-256 hashes + sessionStorage)
- `forms/neumorphism/auth-guard.js` — simple guard to protect pages
- `forms/neumorphism/validators.js` — validators used by UI
- `forms/neumorphism/tests/run-validations.js` — small Node test
- `assets/images/` — consolidated images

## Quick start (Windows PowerShell)
Open the login page directly:

```powershell
Start-Process -FilePath "${PWD}\forms\neumorphism\index.html"
```

Or run a local static server (recommended for realistic redirects and paths):

```powershell
# If Python is installed
python -m http.server 8000
# Then open
Start-Process "http://localhost:8000/forms/neumorphism/index.html"
```

## Accounts (for demo/testing)
- Zolapolysack_PD2 : ZP9965
- Zolapolysack_PD  : ZP1033
- Zolapolysack_PD  : ZP1045
- Zolapolysack_PD  : ZP1048

Note: This is a client-only gate. Do not use for protecting sensitive content.

## How it works
 After success, it checks for a `?next=` query param and redirects there if present (only same-origin relative paths allowed; unsafe targets are ignored).

## Guarding other pages (modules)
 `auth-guard.js` will automatically redirect unauthenticated visitors to `/forms/neumorphism/index.html?next=<current-page>`.

```html
 - Basic protections included:
   - Login attempt lockout (5 failed attempts -> 2 minutes lockout per user)
   - Session expiry (1 hour TTL)
   - Redirect sanitization (`?next=` must be a same-origin relative path)

- `auth-guard.js` will automatically redirect unauthenticated visitors to `/forms/neumorphism/index.html?next=<current-page>`.
- If your login page is in a different path, configure it via `AuthGuard.setLoginPath('/your/login/index.html')` before the guard runs.

Example manual guard call:
```html
<script>
  // Optional: manual check
  if (window.FormAuth && !FormAuth.getSession()) {
    AuthGuard.setLoginPath('/forms/neumorphism/index.html');
    AuthGuard.requireAuth();
  }
</script>
```

## Deploy to GitHub Pages
- Copy the `forms/` folder (and `assets/`) into your Pages repo, keeping the same paths.
- Ensure references like `/forms/neumorphism/auth.js` are valid in your site structure.
- Consider using relative paths if your Pages site is served from a project subpath (e.g., `/your-repo/`). If so, set `AuthGuard.setLoginPath('/your-repo/forms/neumorphism/index.html')`.

## Security notice (important)
- This is a client-side barrier for convenience only. It is not suitable for protecting confidential data.
- Anyone can download the JS files and analyze hashes.
- For real protection, migrate to a server-side or managed auth (e.g., Firebase Auth).

## Troubleshooting
- Login does nothing: Open DevTools Console to check for script path errors.
- Avatar image missing: The UI falls back to SVG; check `assets/images/1048.png` path.
- Redirect not happening: Make sure `?next=` is present in the login page URL, or integrate `auth-guard.js` on the target page.

## Dev tests
Run the small validator tests:
```powershell
node .\forms\neumorphism\tests\run-validations.js
```
