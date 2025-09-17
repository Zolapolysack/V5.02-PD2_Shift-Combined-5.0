// Frontend runtime configuration for PD2 Shift Combined
// Adjust API_BASE_URL for production deployment
(function(){
  if (window.PD2_CONFIG) return; // do not overwrite if already defined earlier
  const local = window.location.hostname.includes('localhost') || window.location.hostname.startsWith('127.');
  window.PD2_CONFIG = {
    API_BASE_URL: local ? 'http://127.0.0.1:8787' : 'https://your-api.example.com'
  };
})();
