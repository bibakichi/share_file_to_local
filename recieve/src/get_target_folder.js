
const fsPromises = require('node:fs/promises');
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = async function () {
    if (!fs.existsSync("target.txt")) {
        const targetFolder = _getDownloadsFolderPath();
        await fsPromises.writeFile("target.txt", targetFolder);
        return targetFolder;
    }
    let text = await fsPromises.readFile("target.txt");
    text = String(text).split("\n")[0];
    const targetFolder = text.trim();
    if (!targetFolder) {
        const targetFolder = _getDownloadsFolderPath();
        await fsPromises.writeFile("target.txt", targetFolder);
        return targetFolder;
    }
    return targetFolder;
}

// windowsのダウンロードフォルダのパスを取得する
function _getDownloadsFolderPath() {
    const userHomeDirectory = os.homedir();
    return path.join(userHomeDirectory, 'Downloads');
}