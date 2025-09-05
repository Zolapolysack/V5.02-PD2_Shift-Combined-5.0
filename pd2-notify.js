// PD2 shared notification module
(function(){
  if (window.PD2Notify) return; // already loaded
  if (!window.PD2NotifyState) window.PD2NotifyState = { recent: [], maxVisible: 6, dedupeTTL: 5000 };

  function ensureContainer(){
    let c = document.getElementById('notifications');
    if (c) return c;
    try {
      c = document.createElement('div');
      c.id = 'notifications';
      c.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(c);
      return c;
    } catch(_) { return null; }
  }

  function PD2Notify(message, type){
    try {
      const state = window.PD2NotifyState;
      const now = Date.now();
      state.recent = state.recent.filter(r => now - r.ts < state.dedupeTTL);
      if (state.recent.some(r => r.msg === message && r.type === type)) return;
      state.recent.push({ msg: message, type: type, ts: now });

      const map = {
        success: { accent: 'bg-emerald-400', role: 'status', icon: '✅' },
        error:   { accent: 'bg-rose-400',   role: 'alert',  icon: '❌' },
        warning: { accent: 'bg-amber-400',  role: 'status', icon: '⚠️' },
        green:   { accent: 'bg-emerald-400', role: 'status', icon: '✅' },
        blue:    { accent: 'bg-sky-400',    role: 'status', icon: 'ℹ️' },
        purple:  { accent: 'bg-violet-400', role: 'status', icon: '✅' },
        orange:  { accent: 'bg-amber-400',  role: 'status', icon: 'ℹ️' },
        red:     { accent: 'bg-rose-400',   role: 'alert',  icon: 'ℹ️' },
        default: { accent: 'bg-slate-400',  role: 'status', icon: 'ℹ️' }
      };
      const cfg = map[type] || map.default;

      const container = ensureContainer();
      if (!container) return;

      // build toast
      const notification = document.createElement('div');
      notification.setAttribute('role', cfg.role);
      notification.setAttribute('aria-live', cfg.role === 'alert' ? 'assertive' : 'polite');
      notification.className = 'pd2-toast notification toast flex items-start gap-3 p-3 rounded-lg shadow-sm max-w-md ring-1 ring-slate-200 bg-white text-slate-900';
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(6px)';

      notification.innerHTML = '\n' +
        '<div class="flex-shrink-0 w-1.5 h-8 rounded ' + cfg.accent + ' pd2-notify-accent" aria-hidden="true"></div>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center justify-between gap-3">' +
            '<div class="flex items-center gap-3 min-w-0">' +
              '<span class="text-lg">' + cfg.icon + '</span>' +
              '<span class="font-medium truncate">' + String(message) + '</span>' +
            '</div>' +
            '<button type="button" class="text-slate-400 hover:text-slate-600 close-notify" aria-label="ปิด">×</button>' +
          '</div>' +
        '</div>' + '\n';

      try {
        while (container.children.length >= state.maxVisible) {
          container.removeChild(container.children[0]);
        }
      } catch(_){}

      container.appendChild(notification);
      requestAnimationFrame(() => {
        notification.style.transition = 'transform .22s ease, opacity .22s ease';
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
      });

      let timer = setTimeout(remove, 5000);
      function remove(){ try { clearTimeout(timer); if (notification.parentNode) notification.parentNode.removeChild(notification); } catch(_){} }

      const closeBtn = notification.querySelector('.close-notify');
      if (closeBtn) closeBtn.addEventListener('click', remove);
      notification.addEventListener('mouseenter', () => clearTimeout(timer));
      notification.addEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(remove, 3000); });

    } catch (err) { try { console.error('PD2Notify error', err); } catch(_){} }
  }

  window.PD2Notify = PD2Notify;
  // alias for backward compatibility
  window.showNotification = PD2Notify;
})();
