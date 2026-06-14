module.exports = {
  apps: [{
    name: "loj",
    script: "node_modules/.bin/next",
    args: "start",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      DB_PROVIDER: "sqlite",
      DATABASE_URL: "file:./data/loj.db",
      PORT: process.env.PORT || 3000,
    },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    max_memory_restart: "500M",
  }],
};
