const BACKEND  = 'node app/app.js';
const FRONTEND = 'node ../frontend/node_modules/vite/bin/vite.js preview ../frontend';

module.exports = {
  apps: [
    {
      name: '5s-evaluation-app',
      cwd: './backend',
      script: 'bash',
      interpreter: 'none',
      args: ['-c', `trap 'kill $(jobs -p) 2>/dev/null' EXIT; ${BACKEND} & ${FRONTEND} & wait -n`],
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
