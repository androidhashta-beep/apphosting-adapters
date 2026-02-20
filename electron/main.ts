import { app, BrowserWindow } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  // In production, the path is relative to the app's root directory after packaging.
  // The `../../` is to go up from `.electron-forge/build/` to the project root.
  const url = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../../out/index.html')}`;

  mainWindow.loadURL(url);

  if (isDev) {
    // Open DevTools automatically if in development
    mainWindow.webContents.openDevTools();
  } else {
    // Hide the menu bar in production for a cleaner look
    mainWindow.setMenuBarVisibility(false);
  }
  
  // Maximize the window for a better kiosk/dashboard experience
  mainWindow.maximize();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
