'use strict';

const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const iconPath = path.join(__dirname, 'assets', 'icon.png');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // The preload imports our shared CommonJS module, which requires an unsandboxed preload.
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
};

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(iconPath);
  }

  app.setAboutPanelOptions({
    applicationName: app.getName(),
    applicationVersion: app.getVersion()
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
