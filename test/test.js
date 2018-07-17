const fs = require('fs')

let buf = Buffer.alloc(0)

const readable = fs.createReadStream("./public/tts.mpVoice.mp3",{})

readable.on("data", (result) => {
    console.log(result);
    buf = Buffer.concat([buf,result])
})
readable.on("end", () => { console.log(buf) })
readable.on("error", (res) => { console.log(res) })