const electron = require('electron');
const { app, BrowserWindow, ipcMain } = electron;
const path = require('path');
const isDev = require('electron-is-dev');
const {mouse, screen, right, left, up, down, straightTo, centerOf, Region, imageResource, sleep, Point} = require("@nut-tree/nut-js");

let mainWindow = null;
app.on('ready', createWindow);
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});
app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 1024,
        title: "Ant Media Conference Application",
        webPreferences: {
            nativeWindowOpen: true,
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
    mainWindow.on('closed', function () {
        mainWindow = null
    })
    mainWindow.on('page-title-updated', function (e) {
        e.preventDefault()
    });
    ipcMain.handle('move-mouse', (evt, arg) => {
        console.log("Moving mouse!");
        const square = async () => {
            await mouse.move(right(500));
            await mouse.move(down(500));
            await mouse.move(left(500));
            await mouse.move(up(500));
        };

        (async () => {
            await square();
            await mouse.move(straightTo(centerOf(new Region(100, 100, 200, 300))));
        })();
    });
    ipcMain.handle('mouse-click', (evt, arg) => {
        (async () => {
            await mouse.setPosition(new Point(arg.x, arg.y));
            if (arg.button === 'left') {
                await mouse.leftClick();
            } else if (arg.button === 'right') {
                await mouse.rightClick();
            }
        })();
    });

}
