
const path = require('node:path');
const {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    clipboard,
    autoUpdater,
} = require('electron');
const getDeviceId = require('./get_device_id');
const getTargetFolder = require('./get_target_folder');
const fsPromises = require('node:fs/promises');
const log = require('electron-log');

try {
    // バグるので自動更新機能は使わない。
    autoUpdater.autoDownload = false;
}
catch (err) { }

module.exports = async function () {

    // このメソッドは、Electron の初期化が完了し、
    // ブラウザウインドウの作成準備ができたときに呼ばれます。
    // 一部のAPIはこのイベントが発生した後にのみ利用できます。
    app.whenReady().then(() => {
        createWindow();

        app.on('activate', () => {
            // macOS では、Dock アイコンのクリック時に他に開いているウインドウがない
            // 場合、アプリのウインドウを再作成するのが一般的です。
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
        })
    })

    // レンダラープロセスからのメッセージを待ち受ける
    ipcMain.on('copy-text', async (event, text) => {
        clipboard.writeText(text); // ★ テキストをクリップボードに書き込み（＝コピー）
    });


    // レンダラープロセスからのメッセージを待ち受ける
    ipcMain.on('get-info', async (event) => {
        try {
            const deviceId = getDeviceId();  // デバイスIDを取得する
            const url = `https://local-uploader-metadatas.s3.ap-northeast-1.amazonaws.com/index.html?di=${deviceId}`;
            //
            // 「preload.js」にデータを送る
            event.sender.send(
                'render-my-data',
                {
                    uploaderUrl: url,
                    uploaderIframe: `<iframe src="${url}" style="display:block; width:90%; max-width: 600px; margin: 20px auto; border:none; height:300px; box-shadow: 2px 4px 12px rgba(0, 0, 0, 0.08); border-radius: 20px;"></iframe>`,
                    targetFolderPath: await getTargetFolder(),
                }
            );
        }
        catch (err) {
            log.error(err);
        }
    });

    // レンダラープロセスからのメッセージを待ち受ける
    ipcMain.on('open-directory-dialog', (event) => {
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }).then(async function (result) {
            if (!result.canceled) {
                const targetFolderPath = result.filePaths[0];
                log.info(`selected folder : ${targetFolderPath}`);
                //
                await fsPromises.writeFile("target.txt", targetFolderPath);
                //
                // 「preload.js」にデータを送る
                event.sender.send('selected-directory', targetFolderPath);
            }
        }).catch(err => {
            log.info(err);
        });
    });

}

async function createWindow() {
    // ブラウザウインドウを作成します。
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            //
            // 参考文献
            // https://www.electronjs.org/ja/docs/latest/tutorial/multithreading
            nodeIntegrationInWorker: true,
        }
    });
    // そしてアプリの index.html を読み込みます。
    mainWindow.loadFile('src/index.html');
    // デベロッパー ツールを開きます。
    //mainWindow.webContents.openDevTools();
}
