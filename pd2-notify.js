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
  if (!window.PD2NotifyState) window.PD2NotifyState = { recent: [], maxVisible: 6, dedupeTTL: 5000 };
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
      function remove(){ 
        try { 
          clearTimeout(timer); 
          if (notification.parentNode) {
            // Remove event listeners before removing element
            if (closeBtn && closeBtn.parentNode) {
              closeBtn.removeEventListener('click', remove);
            }
            notification.removeEventListener('mouseenter', () => clearTimeout(timer));
            notification.removeEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(remove, 3000); });
            notification.parentNode.removeChild(notification);
          }
        } catch(_){} 
      }

      const closeBtn = notification.querySelector('.close-notify');
      if (closeBtn) {
        closeBtn.addEventListener('click', remove);
      }
      notification.addEventListener('mouseenter', () => clearTimeout(timer));
      notification.addEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(remove, 3000); });

    } catch (err) { try { console.error('PD2Notify error', err); } catch(_){} }
  }

  window.PD2Notify = PD2Notify;
  // alias for backward compatibility
  window.showNotification = PD2Notify;
  // Ensure container exists immediately so consumers (and tests) can query it after load
  try { ensureContainer(); } catch(_) {}
  // Polished centered success overlay helper (modern, animated, accessible)
  window.PD2NotifyCenteredSuccess = function(count){
    try {
      const existing = document.getElementById('pd2-centered-success');
      if (existing) existing.remove();
      const el = document.createElement('div');
      el.id = 'pd2-centered-success';
      el.setAttribute('role','status');
      el.setAttribute('aria-live','polite');
      el.style.position = 'fixed'; el.style.left = '50%'; el.style.top = '50%';
  el.style.transform = 'translate(-50%, -50%) scale(.98)';
  // Use extremely high z-index to ensure visibility above any iframe / stacking context on mobile
  el.style.zIndex = 2147483647; // 2^31-1 sentinel
  el.style.pointerEvents = 'none';
      el.style.transition = 'opacity .32s cubic-bezier(.2,.9,.2,1), transform .32s cubic-bezier(.2,.9,.2,1)'; el.style.opacity = '0';

      // Modern card markup with SVG check and close affordance
      el.innerHTML = `
        <div class="pd2-center-card" style="pointer-events:auto; min-width:260px; max-width:680px; width:min(92vw,620px); background:linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,247,250,0.95)); box-shadow:0 20px 50px rgba(2,6,23,0.36); border-radius:16px; padding:18px 22px; display:flex; gap:16px; align-items:center; border:1px solid rgba(2,6,23,0.06);">
          <div style="flex-shrink:0; width:64px; height:64px; border-radius:999px; background:linear-gradient(135deg,#ecfccb,#86efac); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 20px rgba(34,197,94,0.16);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="#065f46" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div style="flex:1; min-width:0">
            <div style="font-size:18px; font-weight:700; color:#062020; line-height:1">บันทึกข้อมูลสำเร็จ</div>
            <div style="margin-top:4px; font-size:13px; color:#475569">${String(count)} รายการ ถูกบันทึกเรียบร้อย</div>
          </div>
          <button aria-label="ปิด" style="background:transparent; border:0; color:#64748b; font-size:20px; line-height:1; padding:6px; margin-left:6px; cursor:pointer; flex-shrink:0;" onclick="(function(){try{document.getElementById('pd2-centered-success')?.remove();}catch(_){} })();">×</button>
        </div>
      `;

      document.body.appendChild(el);
      // animate in
      requestAnimationFrame(()=>{ el.style.opacity='1'; el.style.transform='translate(-50%, -50%) scale(1)'; });
      // auto-dismiss after 4.2s
      const dismissT = setTimeout(()=>{ try{ el.style.opacity='0'; el.style.transform='translate(-50%, -50%) scale(.98)'; setTimeout(()=>{ try{ el.remove(); }catch(_){} }, 320); }catch(_){} }, 4200);
      // make close button accessible: allow keyboard ESC
      function escHandler(e){ if (e.key === 'Escape') { try{ clearTimeout(dismissT); el.remove(); }catch(_){} window.removeEventListener('keydown', escHandler); } }
      window.addEventListener('keydown', escHandler);
      return el;
    } catch(err){ console.error('PD2NotifyCenteredSuccess error', err); }
  };
})();
