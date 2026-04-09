const { app, BrowserWindow } = require('electron');
const path = require('path');

// Require the express server to start it
require('./server.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    title: "Magic-IP",
    backgroundColor: '#060913', // UI match
    autoHideMenuBar: true, // Hide top menu
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Wait 1s for Express to listen before loading
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 1000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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
    process.exit(0);
  }
});
