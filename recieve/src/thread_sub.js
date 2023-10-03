
const path = require('node:path');
const axios = require('axios');
const fsPromises = require('node:fs/promises');
const fs = require('fs');
const getDeviceId = require('./get_device_id');
const getTargetFolder = require('./get_target_folder');
const log = require('electron-log');
const { parentPort } = require('worker_threads');

const deviceId = getDeviceId();  // デバイスIDを取得する
log.info(`Device ID : ${deviceId}\n`);
//
// １回目の処理
_update({ deviceId });
//
// ２回目以降の処理。15秒おきに行う。
const timerId = setInterval(() => _update({ deviceId }), 1000 * 15);
//
// メインプロセスからメッセージを受け取ったら
parentPort.on('message', (message) => {
    //
    // メッセージの内容が「end」だったら終了処理
    if (message != "end") return;
    //
    // ここから終了処理。
    log.info("End processing.");
    if (timerId) {
        clearInterval(timerId);
    }
    //
    // メインプロセスにメッセージを送り返す
    parentPort.postMessage("ended");
    //
    // サブプロセスを終了する
    process.exit(0);
});


//log.info("後始末処理");
//clearInterval(timerId);

// サーバーを監視して、ファイルが追加されていたらダウンロードする
async function _update({ deviceId }) {
    try {
        //
        // サーバーで管理されている、最新のメタデータを取得する。
        const newMetaData = await _getNewMetaData({ deviceId });
        //
        // ローカルコンピューターに保存されている、古いメタデータを取得する。
        const oldMetaData = await _getOldMetaData();
        //
        if (newMetaData.updatedAt === oldMetaData?.updatedAt) {
            log.info(`No change.`);
            return;
        }
        //
        const targetFolder = await getTargetFolder();
        for (const fileName in newMetaData.files) {
            if (newMetaData.files[fileName] === oldMetaData.files[fileName]) continue;
            await _saveFile({
                fileUrl: `https://local-uploader-files.s3.ap-northeast-1.amazonaws.com/${deviceId}/${fileName}`,
                targetFolder: targetFolder,
            });
            log.info(`File "${fileName}" received.`);
        }
        await fsPromises.writeFile("metadata.json", JSON.stringify(newMetaData));
    }
    catch (err) {
        log.error(err);
    }
}

// ローカルコンピューターに保存されている、古いメタデータを取得する。
async function _getOldMetaData() {
    try {
        if (!fs.existsSync("metadata.json")) {
            return {
                files: {},
            };
        }
        const oldMetaData = JSON.parse(await fsPromises.readFile("metadata.json"));
        if (!oldMetaData?.files) {
            return {
                files: {},
            };
        }
        return oldMetaData;
    }
    catch (err) {
        return {
            files: {},
        };
    }
}

// サーバーで管理されている、最新のメタデータを取得する。
async function _getNewMetaData({ deviceId }) {
    const url = `https://local-uploader-metadatas.s3.ap-northeast-1.amazonaws.com/${deviceId}.json`;
    try {
        // サーバーからメタデータを取得
        const response = await axios.get(url, {
            headers: {},
            cache: "no-store"
        });
        const newMetaData = response.data;
        if (!newMetaData?.files) {
            return {
                files: {},
            };
        }
        return newMetaData;
    }
    catch (err) {
        log.error(`\n[ERROR]`);
        log.error(`I tried to retrieve metadata from S3, but it failed.`);
        log.error(`URL : ` + url);
        log.error(err, "\n");
        return {
            files: {},
        };
    }
}

// 任意のURLからバイナリファイルを取得して、ファイルとして保存する関数
async function _saveFile({ fileUrl, targetFolder }) {
    //
    if (!fs.existsSync(targetFolder)) {
        log.info('\nThe destination folder does not exist. Please write the path of the destination folder in the text file "target.txt".');
        log.info(targetFolder);
        throw "";
    }
    //
    // サーバーからバイナリデータを取得
    const targetPath = path.join(targetFolder, path.basename(fileUrl));
    let buffer;
    try {
        // URLからデータを取得
        const response = await axios.get(fileUrl, {
            headers: {},
            responseType: 'arraybuffer', // 追加: レスポンスのタイプをarraybufferとして指定
        });
        buffer = Buffer.from(response.data);
    }
    catch (err) {
        log.error(`\n[ERROR]`);
        log.error(`I tried to retrieve files from S3 but it failed.`);
        log.error(`URL : ` + fileUrl);
        log.error(err);
        throw "";
    }
    //
    // ファイルとして保存する
    try {
        await fsPromises.writeFile(targetPath, buffer);
    }
    catch (err) {
        log.error(`\n[ERROR]`);
        log.error(`I tried to save the file to a local folder, but it failed.`);
        log.error(`Destination : ` + targetPath);
        log.error(err);
        throw "";
    }
}
