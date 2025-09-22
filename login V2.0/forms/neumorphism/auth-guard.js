// Simple client-side auth guard.
// Auto-redirects to the login page if no session is found. Adds ?next=<current-url> for post-login return.
(function(global){
  'use strict';

  function getSession(){
    try { return (global.FormAuth && typeof global.FormAuth.getSession==='function') ? global.FormAuth.getSession() : null; }
    catch(e){ return null; }
  }

  function defaultLoginPath(){
    // Default path assumes repoRoot/forms/neumorphism/index.html
    return '/forms/neumorphism/index.html';
  }

  function getLoginPath(){
    return global.AUTH_GUARD_LOGIN_PATH || defaultLoginPath();
  }

  function currentUrl(){
    try{ return global.location.pathname + global.location.search + global.location.hash; }catch(e){ return '/'; }
  }

  function requireAuth(){
    var s = getSession();
    if (!s) {
      var next = encodeURIComponent(currentUrl());
      var login = getLoginPath();
      try { global.location.href = login + (login.includes('?') ? '&' : '?') + 'next=' + next; } catch(e) {}
      return false;
    }
    return true;
  }

  // Auto-run on DOMContentLoaded if available; otherwise run immediately.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', requireAuth);
  } else {
    requireAuth();
  }

  // Expose minimal API for manual usage
  global.AuthGuard = {
    requireAuth: requireAuth,
    setLoginPath: function(p){ global.AUTH_GUARD_LOGIN_PATH = p; }
  };
})(window);
