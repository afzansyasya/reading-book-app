
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let bookWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile('renderer/index.html');
}

function createBookWindow(book, author) {
  bookWindow = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  bookWindow.loadFile('renderer/book.html');

  bookWindow.webContents.on('did-finish-load', () => {
    bookWindow.webContents.send('book-selected', book, author);
  });
}

ipcMain.on('open-book-window', (event, book, author) => {
  createBookWindow(book, author);
});

ipcMain.on('save-book', (event, data) => {
  const filePath = path.join(__dirname, 'data', 'readlist.json');
  let readlist = [];

  if (fs.existsSync(filePath)) {
    readlist = JSON.parse(fs.readFileSync(filePath));
  }

  readlist.push(data);
  fs.writeFileSync(filePath, JSON.stringify(readlist, null, 2));
});

app.whenReady().then(createMainWindow);
