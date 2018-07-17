var AipSpeechClient = require("baidu-aip-sdk").speech;
var path = require("path")
var fs = require("fs")

// 设置APPID/AK/SK
var APP_ID = "11543597";
var API_KEY = "UrFOcHpxvuyaoZQ8o7BqC9ZG";
var SECRET_KEY = "kej0cLiORLepbsrcGNQaITfRYEQgMxGD";

// 新建一个对象，建议只保存一个对象调用服务接口
var client = new AipSpeechClient(APP_ID, API_KEY, SECRET_KEY);

/**?
 *
 * @param text
 * @param options
 *  spd	String	语速，取值0-9，默认为5中语速	否
 *  pit	String	音调，取值0-9，默认为5中语调	否
 *  vol	String	音量，取值0-15，默认为5中音量	否
 *  per	String	发音人选择, 0为女声，1为男声，3为情感合成-度逍遥，4为情感合成-度丫丫，默认为普通女
 * @return {Promise}
 *
 *  const CHINA_LANGU = "彤哥呀，我已经为你朗读完啦，你今天一共学习了5个单词，继续加油喔"
 *   compoundAudio(CHINA_LANGU, {per:4, pit:6, spd: 7})
 */

// 语音合成
const compoundAudio = (text, options={}) => {
    return new Promise((res,rej) => {
        client.text2audio(text, options).then(function(result) {
            if (result.data) {
                fs.writeFileSync(path.join(__dirname,'ending_audio.mp3'), result.data);
                res(result.data)
            } else {
                rej(result)
            }
        }, function(e) {
            // 发生网络错误
            console.log(e)
        });
    })
}

// compoundAudio("彤哥呀，我已经为你朗读完啦，你今天一共学习了5个单词，继续加油喔", {per:4, pit:6, spd: 7})

export default compoundAudio