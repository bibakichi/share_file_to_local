
const getMAC = require('getmac').default
const { createHash } = require('crypto');

// デバイスごとに固有のIDを取得する関数
module.exports = function () {
    // MACアドレスを取得する
    const macAddress = getMAC();
    // MACアドレスから「:」を取り除いて、可能な限り文字数を減らす
    const macAddress2 = macAddress.replaceAll(":", "");
    // MACアドレスをハッシュ化する（不可逆で一意な暗号化）
    return createHash('md5').update(macAddress2).digest('hex');
}
