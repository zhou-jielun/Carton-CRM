const { app, BrowserWindow, dialog } = require('electron');
const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;
let backendProcess;

function getBackendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend', 'dist', 'index.js');
  }
  const devPath = path.join(__dirname, '..', 'backend', 'src', 'index.ts');
  const prodPath = path.join(__dirname, '..', 'backend', 'dist', 'index.js');
  if (fs.existsSync(prodPath)) return prodPath;
  return devPath;
}

function getBackendCwd() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'backend');
  }
  return path.join(__dirname, '..', 'backend');
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const backendPath = getBackendPath();
    const cwd = getBackendCwd();
    const isDev = backendPath.endsWith('.ts');

    console.log('[Electron] Starting backend:', backendPath);
    console.log('[Electron] CWD:', cwd);

    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '3001',
    };
    // Node.js v24 rejects --use-system-ca in NODE_OPTIONS
    delete env.NODE_OPTIONS;

    if (app.isPackaged) {
      env.FRONTEND_DIST_PATH = path.join(__dirname, '..', 'frontend', 'dist');
    }

    if (isDev) {
      backendProcess = fork(require.resolve('tsx'), [backendPath], {
        cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      });
    } else {
      backendProcess = fork(backendPath, [], {
        cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      });
    }

    let resolved = false;

    backendProcess.on('message', (msg) => {
      if (msg === 'server-ready' && !resolved) {
        resolved = true;
        resolve();
      }
    });

    backendProcess.stdout.on('data', (data) => {
      const text = data.toString();
      console.log('[Backend]', text.trim());
      if (!resolved && text.includes('port')) {
        resolved = true;
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error('[Backend:err]', data.toString().trim());
    });

    backendProcess.on('error', (err) => {
      console.error('[Electron] Backend error:', err);
      if (!resolved) reject(err);
    });

    backendProcess.on('exit', (code) => {
      console.log('[Electron] Backend exited with code:', code);
      if (!resolved) {
        reject(new Error(`Backend exited with code ${code}`));
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, 15000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Carton CRM - AI全自动外贸获客助手',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.loadURL('http://localhost:3001');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.setTitle('Carton CRM - AI全自动外贸获客助手');
  });
}

app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
  } catch (err) {
    console.error('[Electron] Failed to start:', err);
    dialog.showErrorBox('启动失败', '后端服务启动失败，请检查日志: ' + err.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});
