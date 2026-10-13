const FRONTEND_PORT = 5173;

module.exports = {
  apps: [
    {
      name: '5s-backend',
      cwd: './backend',
      script: 'app/app.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: '5s-frontend',
      cwd: './frontend',
      script: 'node_modules/vite/bin/vite.js',
      args: `preview --host --port ${FRONTEND_PORT} --strictPort`,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
