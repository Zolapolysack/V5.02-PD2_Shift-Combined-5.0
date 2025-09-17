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

      // build toast (visual-only changes; logic untouched)
      const notification = document.createElement('div');
      notification.setAttribute('role', cfg.role);
      notification.setAttribute('aria-live', cfg.role === 'alert' ? 'assertive' : 'polite');
  notification.className = 'pd2-toast notification toast group relative overflow-hidden flex items-center gap-3 p-2.5 pr-2 rounded-lg shadow-md max-w-sm ring-1 ring-slate-200/70 bg-white/95 backdrop-blur-sm text-slate-800 border border-slate-100 text-[13px] leading-snug';
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(6px)';

      // Accent & subtle gradient background (using an absolutely positioned element for symmetry)
      const gradientMap = {
        'bg-emerald-400': 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
        'bg-rose-400': 'linear-gradient(135deg,#fff1f2,#ffe4e6)',
        'bg-amber-400': 'linear-gradient(135deg,#fffbeb,#fef3c7)',
        'bg-sky-400': 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
        'bg-violet-400': 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
        'bg-slate-400': 'linear-gradient(135deg,#f8fafc,#f1f5f9)'
      };
      const accentBar = '<div class="absolute inset-y-0 left-0 w-1.5 ' + cfg.accent + ' pd2-notify-accent" aria-hidden="true" style="border-top-left-radius:inherit;border-bottom-left-radius:inherit"></div>';
  const iconWrap = '<div class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center shadow-inner border border-slate-200/70 bg-white/70" style="backdrop-filter:blur(4px)"><span class="text-base leading-none">' + cfg.icon + '</span></div>';
  const closeBtnHTML = '<button type="button" class="close-notify ml-1 text-slate-400 hover:text-slate-600 transition-colors rounded-md h-6 w-6 flex items-center justify-center focus:outline-none focus-visible:ring focus-visible:ring-emerald-400/50" aria-label="ปิด">×</button>';

      notification.innerHTML = '\n' +
        accentBar +
        '<div class="flex items-center gap-3 w-full" style="background:' + (gradientMap[cfg.accent] || gradientMap['bg-slate-400']) + '; border-radius:10px; padding:6px 6px 6px 10px;">' +
          iconWrap +
          '<div class="flex-1 min-w-0">' +
            '<div class="font-medium text-[12.5px] tracking-wide text-slate-900 truncate">' + String(message) + '</div>' +
          '</div>' +
          closeBtnHTML +
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

      let autoMs = 1200; // new shorter lifetime
      let timer = setTimeout(startFadeOut, autoMs);
      let fading = false;
      function startFadeOut(){
        if (fading) return; fading = true;
        try {
          notification.style.transition = (notification.style.transition || '') + ', opacity .25s ease';
          notification.style.opacity = '0';
          setTimeout(remove, 260);
        } catch(_) { remove(); }
      }
      function remove(){ 
        try { 
          clearTimeout(timer); 
          if (notification.parentNode) {
            // Remove event listeners before removing element
            if (closeBtn && closeBtn.parentNode) {
              closeBtn.removeEventListener('click', handleCloseClick);
            }
            notification.removeEventListener('mouseenter', onEnter);
            notification.removeEventListener('mouseleave', onLeave);
            notification.parentNode.removeChild(notification);
          }
        } catch(_){} 
      }
      const closeBtn = notification.querySelector('.close-notify');
      function handleCloseClick(){ startFadeOut(); }
      function onEnter(){ clearTimeout(timer); }
      function onLeave(){ clearTimeout(timer); if (!fading) timer = setTimeout(startFadeOut, 400); }
      if (closeBtn) closeBtn.addEventListener('click', handleCloseClick);
      notification.addEventListener('mouseenter', onEnter);
      notification.addEventListener('mouseleave', onLeave);

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
      el.style.position = 'fixed';
      el.style.inset = '0';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.background = 'rgba(15,23,42,0.28)'; // soft backdrop
      el.style.backdropFilter = 'blur(4px) saturate(1.3)';
      el.style.webkitBackdropFilter = 'blur(4px) saturate(1.3)';
      el.style.zIndex = 2147483647;
      el.style.opacity = '0';
      el.style.transition = 'opacity .4s cubic-bezier(.3,.9,.3,1)';

      const card = document.createElement('div');
      card.className = 'pd2-center-card';
      card.style.position = 'relative';
      card.style.pointerEvents = 'auto';
      card.style.minWidth = '260px';
      card.style.maxWidth = '560px';
      card.style.width = 'min(92vw,520px)';
      card.style.borderRadius = '20px';
      card.style.padding = '26px 28px 30px 28px';
      card.style.background = 'linear-gradient(145deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))';
      card.style.border = '1px solid rgba(2,6,23,0.08)';
      card.style.boxShadow = '0 4px 15px -4px rgba(2,6,23,0.06), 0 25px 55px -10px rgba(2,6,23,0.35)';
      card.style.display = 'flex';
      card.style.gap = '22px';
      card.style.alignItems = 'center';
      card.style.transform = 'translateY(12px) scale(.96)';
      card.style.opacity = '0';
      card.style.transition = 'opacity .55s cubic-bezier(.25,.9,.25,1), transform .55s cubic-bezier(.25,.9,.25,1)';

      // Animated success icon
      const iconWrap = document.createElement('div');
      iconWrap.style.width = '72px';
      iconWrap.style.height = '72px';
      iconWrap.style.flexShrink = '0';
      iconWrap.style.borderRadius = '999px';
      iconWrap.style.display = 'flex';
      iconWrap.style.alignItems = 'center';
      iconWrap.style.justifyContent = 'center';
      iconWrap.style.background = 'linear-gradient(135deg,#dcfce7,#86efac)';
      iconWrap.style.boxShadow = '0 10px 30px -6px rgba(34,197,94,0.35), 0 4px 10px -2px rgba(34,197,94,0.25)';
      iconWrap.innerHTML = '<svg class="pd2-center-icon" width="40" height="40" viewBox="0 0 44 44" fill="none" stroke="#065f46" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="overflow:visible">' +
        '<circle cx="22" cy="22" r="20" stroke="#34d399" stroke-width="3" opacity=".25" />' +
        '<path d="M30 16 L19.5 27.5 L14 22" stroke-dasharray="34" stroke-dashoffset="34" />' +
      '</svg>';

      const textWrap = document.createElement('div');
      textWrap.style.flex = '1';
      textWrap.style.minWidth = '0';
      textWrap.innerHTML = '<div style="font-size:20px;font-weight:700;color:#022c22;letter-spacing:.5px;line-height:1">บันทึกข้อมูลสำเร็จ</div>'+
        '<div style="margin-top:6px;font-size:14px;color:#475569;line-height:1.35">' + String(count) + ' รายการ ถูกบันทึกเรียบร้อย</div>';

      const closeBtn = document.createElement('button');
      closeBtn.setAttribute('aria-label','ปิด');
      closeBtn.innerHTML = '×';
      Object.assign(closeBtn.style, {
        position:'absolute', top:'10px', right:'12px', background:'transparent', border:'0',
        color:'#64748b', fontSize:'24px', lineHeight:'1', padding:'6px', cursor:'pointer',
        borderRadius:'8px'
      });
      closeBtn.onmouseenter = () => closeBtn.style.color = '#0f172a';
      closeBtn.onmouseleave = () => closeBtn.style.color = '#64748b';

      // Progress bar at bottom (auto-dismiss indicator)
      const prog = document.createElement('div');
      prog.style.position = 'absolute';
      prog.style.left = '0';
      prog.style.bottom = '0';
      prog.style.height = '4px';
      prog.style.background = 'linear-gradient(90deg,#06b6d4,#34d399,#10b981)';
      prog.style.width = '100%';
      prog.style.transformOrigin = 'left';
      prog.style.transform = 'scaleX(1)';
      prog.style.transition = 'transform 3.4s linear';
      prog.style.borderBottomLeftRadius = 'inherit';
      prog.style.borderBottomRightRadius = 'inherit';

      card.appendChild(iconWrap);
      card.appendChild(textWrap);
      card.appendChild(closeBtn);
      card.appendChild(prog);
      el.appendChild(card);
      document.body.appendChild(el);

      // Animate reveal
      requestAnimationFrame(()=>{ el.style.opacity = '1'; });
      requestAnimationFrame(()=>{ card.style.opacity='1'; card.style.transform='translateY(0) scale(1)'; });
      // Animate check stroke
      setTimeout(()=>{
        try {
          const path = card.querySelector('path');
          if (path) {
            path.style.transition = 'stroke-dashoffset .85s cubic-bezier(.4,.9,.2,1)';
            path.style.strokeDashoffset = '0';
          }
        }catch(_){}
      },160);
      // Start progress drain
      setTimeout(()=>{ prog.style.transform = 'scaleX(0)'; }, 40);

      // Auto-dismiss after 3.5s
      const dismissDelay = 3500;
      const dismissT = setTimeout(close, dismissDelay);

      function close(){
        try {
          clearTimeout(dismissT);
          el.style.opacity = '0';
          card.style.transform='translateY(4px) scale(.985)';
          card.style.opacity='0';
          setTimeout(()=>{ try{ el.remove(); }catch(_){} }, 420);
          window.removeEventListener('keydown', escHandler);
        } catch(_){}
      }
      function escHandler(e){ if (e.key === 'Escape') close(); }
      window.addEventListener('keydown', escHandler);
      closeBtn.addEventListener('click', close);
      // Allow manual re-trigger to not trap focus (no focus handling required here)
      return el;
    } catch(err){ console.error('PD2NotifyCenteredSuccess error', err); }
  };
})();
