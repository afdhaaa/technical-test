#!/bin/sh
set -e

echo "=================================================="
echo "Dexa HRIS Backend Container Initializing..."
echo "=================================================="

# Check database readiness with a lightweight Node script
echo "Checking database connectivity..."
node -e '
const net = require("net");
const host = process.env.DB_HOST || "mysql";
const port = parseInt(process.env.DB_PORT || "3306", 10);
let attempts = 0;
const maxAttempts = 30;

function check() {
  attempts++;
  const s = net.createConnection(port, host, () => {
    console.log(`[OK] Successfully connected to database at ${host}:${port}`);
    s.destroy();
    process.exit(0);
  });
  s.on("error", (err) => {
    if (attempts >= maxAttempts) {
      console.error(`[ERROR] Failed to reach database at ${host}:${port} after ${maxAttempts} attempts.`);
      process.exit(1);
    }
    console.log(`[WAIT] Database (${host}:${port}) not ready yet, retrying (${attempts}/${maxAttempts})...`);
    setTimeout(check, 2000);
  });
}
check();
'

# Run database seeder if needed
echo "Running database seeder..."
npx ts-node src/seed.ts || echo "Database seeder completed or already seeded."

# Start NestJS backend
echo "Starting Dexa HRIS Backend on port ${PORT:-3000}..."
exec node dist/main
