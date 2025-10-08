// Simple local dev runner that avoids react-rapide's GitHub fetch
// - Starts the .NET backend on port 5001
// - Starts Vite dev server
// - Adds cleanup on exit

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');
const backendDir = path.join(repoRoot, 'backend');
const distDir = path.join(repoRoot, 'dist');
const dbPath = path.join(backendDir, '_db.sqlite3');
const backendPort = 5001;

// Ensure dist exists so backend static serving doesn't fail unexpectedly
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

let procs = [];

function onExit() {
  for (const p of procs) {
    try { p.kill(); } catch (_) {}
  }
}

process.on('SIGINT', () => { onExit(); process.exit(0); });
process.on('SIGTERM', () => { onExit(); process.exit(0); });
process.on('exit', onExit);

// Start backend (.NET Minimal API) matching backend/index.js args
const backendArgs = [
  'run',
  backendPort.toString(),
  `"${distDir}"`,
  `"${dbPath}"`
];

console.log(`[dev-both] Starting backend: dotnet ${backendArgs.join(' ')} (cwd: ${backendDir})`);
const backend = spawn('dotnet', backendArgs, {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true
});
procs.push(backend);

// Start Vite dev server using local binary
const viteBin = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
console.log(`[dev-both] Starting Vite: node ${viteBin}`);
const vite = spawn('node', [viteBin], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: false
});
procs.push(vite);

