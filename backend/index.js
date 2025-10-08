// A Node.js based start up for the C#-based backend
// (integrates with React Rapide that starts the index.js file in backend)
// Allows the backend to start running as we start the Vite dev server!

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import proxy from 'express-http-proxy';
import { isFreePort } from 'find-free-ports';
import chokidar from 'chokidar';

export default function startBackend(app) {

  app.disable('x-powered-by');

  let message = `<pre>
    In order to see something meaningful here
    run <b>npm run build</b> that compiles/builds
    your Vite-based project to the dist folder first.

    Then you can see the production version of the app
    served from the dist folder here.
  </pre>`;

  // Create the dist folder if it does not exist
  const distFolder = path.join(import.meta.dirname, '..', 'dist');
  fs.existsSync(distFolder) || (
    fs.mkdirSync(distFolder),
    fs.writeFileSync(path.join(distFolder, 'index.html'), message, 'utf-8')
  );

  // Calculate db path
  const dbPath = path.join(import.meta.dirname, '_db.sqlite3');

  // Calculate db template path
  const dbTemplatePath = path.join(import.meta.dirname, 'db_template', '_db.sqlite3');

  // Copy the database from template folder to backend folder if it does not exist there
  fs.existsSync(dbPath) || fs.copyFileSync(dbTemplatePath, dbPath);

  let currentPort = 5001;
  let backendProcess = null;

  const proxyMiddleware = (req, res, next) => {
    proxy(`localhost:${currentPort}`, {
      proxyReqPathResolver(req) {
        return '/api' + req.url;
      }
    })(req, res, next);
  };

  app.use('/api', proxyMiddleware);

  async function findFreePort() {
    let port = 5001;
    while (!await isFreePort(port)) {
      port++;
    }
    return port;
  }

  function startProcess(initialStart = false) {
    const portPromise = findFreePort();
    portPromise.then(port => {
      currentPort = port;
      backendProcess = spawn(
        `dotnet run ${currentPort} "${distFolder}" "${dbPath}"`,
        { cwd: import.meta.dirname, stdio: 'inherit', shell: true }
      );

      process.on('exit', () => backendProcess && backendProcess.kill());

      if (initialStart) {
        setTimeout(() => {
          console.log(
            'Started C#/.NET based Minimal API\n' +
            '\nNote:\nStill visit the Vite Dev Port for all requests,\n' +
            'unless you want to check a build,\n' +
            `in that case visit the server port (${currentPort}) directly.\n`
          );
        }, 3000);
      }
    });
  }

  startProcess(true);

  chokidar.watch(path.join(import.meta.dirname, 'src'))
    .on('all', (event, filePath) => {
      if (event === 'change' && (filePath + '').endsWith('.cs')) {
        if (backendProcess) {
          backendProcess.kill();
        }
        console.log(event, filePath);
        console.log('\nRestarting backend because of changes to source!\n');
        startProcess();
      }
    });
}

