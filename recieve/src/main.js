
const { Worker, isMainThread } = require('worker_threads');
const mainThread = require('./thread_main');
const { app } = require('electron');
const path = require('node:path');

if (isMainThread) {
    // メインスレッドの処理
    mainThread();

    const worker = new Worker(path.join(__dirname, 'thread_sub.js'));

    // 全ウインドウが閉じられたとき
    app.on('window-all-closed', async () => {
        if (process.platform === 'darwin') {
            // macOSの場合は、全ウインドウが閉じられても終了しません。
            // ユーザーが Cmd + Q で明示的に終了するまで、
            // アプリケーションとそのメニューバーをアクティブにするのが一般的です。
            return;
        }
        // メインスレッドからワーカースレッドに終了メッセージを送る
        worker.postMessage('end');
    });

    // ワーカースレッドからの返信メッセージを受け取る
    worker.on('message', (response) => {
        worker.terminate().then(() => {
            app.quit();
        });
    });

    process.on("exit", exitCode => {
        worker.terminate().then(() => {
            app.quit();
        });
    });
    process.on("SIGINT", () => process.exit(0));
}