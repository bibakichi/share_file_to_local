
const { ipcRenderer } = require('electron');
// プリロードプロセスでは Node.js の全 API が利用可能です。
// Chrome 拡張機能と同じサンドボックスも持っています。


let uploaderUrlElement;
let urlCopyElement;
let uploaderIframeElement;
let iframeCopyElement;
let folderPathElement;
let folderSelectorElement;

// ページを読み込んだら、はじめに実行する関数
window.addEventListener('DOMContentLoaded', async function () {
    uploaderUrlElement = document.getElementById("uploader_url");
    urlCopyElement = document.getElementById("url_copy");
    uploaderIframeElement = document.getElementById("uploader_iframe");
    iframeCopyElement = document.getElementById("iframe_copy");
    folderPathElement = document.getElementById("folder_path");
    folderSelectorElement = document.getElementById("folder_selector");
    //
    ipcRenderer.send('get-info');
    //
    folderSelectorElement.addEventListener("click", () => {
        ipcRenderer.send('open-directory-dialog');
    });
    //
    urlCopyElement.addEventListener('click', (event) => { // ボタンをクリックしたら
        const text = uploaderUrlElement.value; // テキスト取得
        ipcRenderer.send('copy-text', text);
        urlCopyElement.innerHTML = 'OK'; // ボタンの文字変更
        setTimeout(() => (urlCopyElement.innerHTML = 'コピー'), 1000); // ボタンの文字を戻す
    });
    //
    iframeCopyElement.addEventListener('click', (event) => { // ボタンをクリックしたら
        const text = uploaderIframeElement.value; // テキスト取得
        ipcRenderer.send('copy-text', text);
        iframeCopyElement.innerHTML = 'OK'; // ボタンの文字変更
        setTimeout(() => (iframeCopyElement.innerHTML = 'コピー'), 1000); // ボタンの文字を戻す
    });
});

// メインプロセスから送られたデータを受信したときに、実行されるイベント
ipcRenderer.on('selected-directory', (event, targetFolderPath) => {
    folderPathElement.value = targetFolderPath;
});

// メインプロセスから送られたデータを受信したときに、実行されるイベント
ipcRenderer.on('render-my-data', (event, params) => {
    console.log(params);
    const { uploaderUrl, uploaderIframe, targetFolderPath } = params;
    uploaderUrlElement.value = uploaderUrl;
    uploaderIframeElement.value = uploaderIframe;
    folderPathElement.value = targetFolderPath;
});