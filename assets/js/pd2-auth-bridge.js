// PD2 Auth Bridge: lightweight overlay login gate using existing login V2.0 page
// - Non-invasive: does not change module navigation; just blocks UI until session exists
// - Success criteria: sessionStorage["neuroAuth"] present and not expired
// - Dismiss flow: parent receives PD2_AUTH_OK postMessage OR detects sessionStorage set
(function(global){
  'use strict';

  function now(){ return Date.now ? Date.now() : new Date().getTime(); }

  function getSession(){
    try {
      const raw = global.sessionStorage.getItem('neuroAuth');
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.exp) return null;
      if (now() > obj.exp) { try { global.sessionStorage.removeItem('neuroAuth'); } catch(_){}; return null; }
      return obj;
    } catch (e) { return null; }
  }

  function isAuthed(){ return !!getSession(); }

  function createOverlay(loginPath){
    // Styles scoped via unique ids/classes to avoid collisions
    const overlay = document.createElement('div');
    overlay.id = 'pd2-auth-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Authentication Required');
    overlay.style.cssText = [
      'position:fixed','inset:0','z-index:2147483000','display:flex',
      'align-items:center','justify-content:center','background:rgba(2,6,23,0.72)',
      'backdrop-filter:blur(6px)','-webkit-backdrop-filter:blur(6px)'
    ].join(';');

    const card = document.createElement('div');
    card.id = 'pd2-auth-card';
    card.style.cssText = [
      'width:min(960px, 96vw)','height:min(620px, 92vh)','border-radius:16px',
      'overflow:hidden','box-shadow:0 20px 60px rgba(0,0,0,0.35)','background:#0b1220',
      'border:1px solid rgba(255,255,255,0.14)'
    ].join(';');

    const frame = document.createElement('iframe');
    frame.id = 'pd2-auth-frame';
    frame.title = 'PD2 Login';
    frame.allow = 'clipboard-read; clipboard-write';
    frame.style.cssText = 'width:100%;height:100%;border:0;display:block;background:#0b1220';
    // Encode path fragments (handles spaces in folder names)
    try {
      const [p, q] = String(loginPath).split('?');
      const encoded = p.split('/').map(seg => encodeURIComponent(seg)).join('/');
      frame.src = encoded + (q ? ('?' + q) : '') + (q ? '&' : '?') + 'v=' + encodeURIComponent(String(now()));
    } catch(_) {
      frame.src = loginPath + (loginPath.indexOf('?') > -1 ? '&' : '?') + 'v=' + encodeURIComponent(String(now()));
    }

    // Header (minimal) for branding and safe-exit on failure
    const hdr = document.createElement('div');
    hdr.style.cssText = 'position:absolute;top:8px;left:12px;right:12px;display:flex;align-items:center;justify-content:space-between;z-index:2;pointer-events:none';
    const brand = document.createElement('div');
    brand.style.cssText = 'display:flex;align-items:center;gap:8px;color:#e5e7eb;font-weight:600;font-size:14px;pointer-events:auto';
    brand.innerHTML = '<span style="width:10px;height:10px;border-radius:3px;background:linear-gradient(135deg,#06b6d4,#3b82f6);display:inline-block"></span> <span>PD2 • Sign in</span>';
  const help = document.createElement('button');
  help.type = 'button';
  help.textContent = 'Problem';
    help.style.cssText = 'pointer-events:auto;background:transparent;border:1px solid rgba(255,255,255,0.25);color:#e5e7eb;border-radius:10px;font-size:12px;padding:4px 8px;opacity:.9';
  help.addEventListener('click', function(){
    alert(`หากเข้าสู่ระบบไม่ได้ โปรดลอง:\n1.) รีเฟรชหน้า Ctrl+F5\n2.) ใช้รหัสผ่านล่าสุด\n3.) ติดต่อผู้ดูแลระบบ`);
  });
    hdr.appendChild(brand); hdr.appendChild(help);

    card.appendChild(hdr);
    card.appendChild(frame);
    overlay.appendChild(card);
    return { overlay, frame };
  }

  function mountLoginGate(opts){
    const options = Object.assign({ loginPath: './login V2.0/forms/neumorphism/index.html', onUnlock: null }, opts || {});
    try {
      // If already authed, nothing to do
      if (isAuthed()) return null;

      // Avoid double-mount
      if (document.getElementById('pd2-auth-overlay')) return document.getElementById('pd2-auth-overlay');

  const { overlay, frame } = createOverlay(options.loginPath);
      document.body.appendChild(overlay);
  // Inert/aria-hide background for accessibility and to prevent interaction leakage
  const root = document.getElementById('main') || document.body;
  try { root.setAttribute('inert',''); } catch(_){}
  try { root.setAttribute('aria-hidden','true'); } catch(_){}

      // Poll fallback: if login page writes sessionStorage (shared by same-origin frames), detect and close
      let pollId = setInterval(() => {
        try { if (isAuthed()) { cleanup(true); } } catch(_){}
      }, 600);

      const cleanup = (ok) => {
        try { clearInterval(pollId); } catch(_){}
        try { global.removeEventListener('message', onMsg); } catch(_){}
  try { overlay.remove(); } catch(_){}
  // Restore background interactivity
  try { root.removeAttribute('inert'); root.removeAttribute('aria-hidden'); } catch(_){}
        if (ok && typeof options.onUnlock === 'function') {
          try { options.onUnlock(getSession()); } catch(_){}
        }
        // Friendly toast if available
        try {
          if (ok && global.PD2Notify) global.PD2Notify('เข้าสู่ระบบสำเร็จ','success');
        } catch(_){}
      };

      const onMsg = (ev) => {
        try {
          const m = ev && ev.data;
          if (!m || typeof m !== 'object') return;
          // Only same-origin messages from our iframe are accepted
          const sameOrigin = (function(){ try { return ev.origin === global.location.origin; } catch(_) { return false; } })();
          if (!sameOrigin) return;
          const fromFrame = (function(){ try { return ev.source === frame.contentWindow; } catch(_) { return false; } })();
          if (!fromFrame) return;
          if (m.type === 'PD2_AUTH_OK') {
            // Ensure a session exists as a fallback if the login page didn't set one
            try {
              if (!isAuthed()) {
                const user = (m && m.user) ? String(m.user) : 'user';
                const ttl = 60 * 60 * 1000; // 1 hour
                const payload = { user, ts: now(), exp: now() + ttl };
                try { global.sessionStorage.setItem('neuroAuth', JSON.stringify(payload)); } catch(_){}
              }
            } catch(_){}
            cleanup(true);
          } else if (m.type === 'PD2_AUTH_LOGOUT') {
            try { global.sessionStorage.removeItem('neuroAuth'); } catch(_){}
          }
        } catch (_) {}
      };
      global.addEventListener('message', onMsg);

      // Focus trap: move focus into iframe
      setTimeout(() => { try { frame.focus(); } catch(_){} }, 50);

      return overlay;
    } catch (err) {
      try { console.error('[PD2_AUTH] mount gate failed', err); } catch(_){}
      return null;
    }
  }

  function logout(){ try { global.sessionStorage.removeItem('neuroAuth'); } catch(_){} }

  global.PD2Auth = { isAuthed, mountLoginGate, logout };
})(window);
