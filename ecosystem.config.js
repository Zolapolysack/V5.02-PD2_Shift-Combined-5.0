module.exports = {
  apps: [
    {
      name: 'pd2-api',
      script: 'server/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        // Placeholders: set these on the host or via pm2 environment
        API_TOKEN: process.env.API_TOKEN || '',
        // If you use a service account, set GOOGLE_SERVICE_ACCOUNT_JSON to the JSON string
        GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ''
      }
    }
    ,{
      name: 'pd2-monitor',
      script: 'scripts/monitor.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
