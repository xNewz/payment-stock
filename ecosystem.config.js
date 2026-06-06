// PM2 Ecosystem Config
// Usage: pm2 start ecosystem.config.js
// Docs:  https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      name: 'payment-stock',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: './',

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        HOSTNAME: '0.0.0.0',
      },

      // Auto-restart policy
      instances: 1,          // Set to 'max' to use all CPU cores (cluster mode)
      exec_mode: 'fork',     // Use 'cluster' if instances > 1
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
    },
  ],
};
