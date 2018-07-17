'use strit'

import {opts} from '../../app'
import moment from 'moment'
import http from 'http';
import audioCompond from '../../handle/audioCompond'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import {connection} from '../../app'

class GenerateAudio {

    constructor(opt={}){
        const defaultOptions = {
            speechType: 0,  //默认美式口音, 1英 0美
            maxSentenceNum: 1, //例句数量
            isAddReadTranslate: true, //是否添加单词汉译
            isAddSenTranslate: true, //是有拥有例句汉译
            wordStayBetween: 0, //每个单词之间停留的时间 unit: ms
            beforeReadWord: true, //先朗读单词后朗读例子系列
            wordAndSenSort: 0//例句的英文与汉译播放的先后顺序 0-英前译后  1-译前英后
        }
        this.getWordUrl = (word) => `http://dict.youdao.com/speech?audio=${word}`
        this.getSentenceUrl = (word)=>`http://dict.youdao.com/jsonapi?q=lj:${word}&doctype=json&keyfrom=mac.main&id=&vendor=cidian.youdao.com&appVer=1.4&client=macdict&le=eng`
        this.requestAudioOptions = {
            hostname: "http://dict.youdao.com",
            port: 80,
            path: '/',
            method: 'GET',
            headers: {}
        }
        this.options = Object.assign(defaultOptions, opt)
        this.currentSearchedWord = [];
    };

    __catchThenble = (err) => {
        console.log(err);
    }

    // @return {Array}[map3]
    getHistoryAodio(req,res,next){}

    //请求音频文件
    //type 美音 | 英音
    requestAudioFile = (cb) => {
        let buffer = Buffer.alloc(0)
        let num = 0;
        const { maxSentenceNum } = this.options;
        this.currentSearchedWord.forEach(({word, translated}, key) => {
            const wordPro = this.requestWordAudio(word);
            const wordTranslated = audioCompond(translated);
            const sentencePro = this.requestSenAudio(word);
            /**
             * @wordResBuffer { mp3 buffer }
             * @sentenceResBuffer { JSON buffer }
             * @wordTranslatedAudioBuffer { mp3 buffer }
             */
            Promise.all([wordPro,sentencePro,wordTranslated]).then(([wordAudioBuffer, sentenceResBuffer, wordTranslatedAudioBuffer]) => {
                const sentenceList = this.sentenceFormatFilter(sentenceResBuffer)
                let sentences = Buffer.alloc(0);
                // 获取有关句子音频
                for (let i = 0; i < sentenceList.length; i++) {
                    let { sentence, sentence_translate } = sentenceList[i];
                    Promise.all([audioCompond(sentence),audioCompond(sentence_translate)]).then(async (res) => {
                        if (!res) { throw TypeError("audioCompond type is error") }
                        const [senAudioBuf,SenTraAudioBuf] = res;
                        const isEndSentence = i === maxSentenceNum-1;
                        sentences = Buffer.concat([sentences, senAudioBuf, SenTraAudioBuf])
                        if ( isEndSentence ) {
                            ++num;  //一个示例正式结束
                            // 此处为一个单词对应的例句完整结束， wordAudioBuffer + sentences 是一个完整的 word + sentence + translate
                            buffer = Buffer.concat([buffer, wordAudioBuffer, wordTranslatedAudioBuffer, sentences])
                            if (num === this.currentSearchedWord.length) {
                                const newBuf = await this.makeEnding(buffer)
                                cb(newBuf)
                            }
                        }
                    }).catch(this.__catchThenble)
                }
            }).catch(this.__catchThenble)
        })
    }

    makeEnding = (buffer) => {
        return new Promise((resolve,reject) => {
            let buf = Buffer.alloc(0)
            const readable = fs.createReadStream(path.join(__dirname,"../../public/ending_audio.mp3"),{})
            readable.on("data", (result) => { buf = Buffer.concat([buf,result]) })
            readable.on("end", () => { resolve(Buffer.concat([buffer, buf])) })
            readable.on("error", (res) => { reject(res) })
        })
    }

    requestWordAudio = (word) => {
        let buf = Buffer.alloc(0);
        return new Promise((resolve,reject) => {
            const req = http.request(this.getWordUrl(word), (res) => {
                res.on('data', (chunk) => {
                    console.log("word-data", chunk.length)
                    buf = Buffer.concat([buf, chunk])
                });
                res.on('end', () => {
                    console.log("word-end", buf.length)
                    resolve(buf)
                });
            })
            req.end();
            req.on("error", (err) => { reject(err); })
        })
    }

    requestSenAudio = (word) => {
        let buf = Buffer.alloc(0);
        return new Promise((resolve,reject) => {
            const req = http.request(this.getSentenceUrl(word), (res) => {
                //生成中文语音
                // audioCompond()
                res.on('data', (chunk) => {
                    console.log("sen-data", chunk.length)
                    buf = Buffer.concat([buf,chunk])
                });
                res.on('end', () => {
                    console.log("sen-end", buf.length);
                    resolve(buf)
                })
            })
            req.end();
            req.on("error", (err) => { reject(err); })
        })
    }

    /**
     *
     * @param dataSource {Buffer-JSON}
     * @return {Array}
     */
    sentenceFormatFilter = (dataSource) => {
        let sentenceArr = [];
        const {maxSentenceNum} = this.options;
        try { dataSource = JSON.parse(dataSource.toString()) } catch (err) {
            console.log(err);
        }
        const sentence_pair = _.get(dataSource,"blng_sents.sentence-pair",[])
        for (let i = 0; i < maxSentenceNum; i++) {
            if ( !sentence_pair[i] ) {  console.warn("没有示例句"); break; }
            let {sentence} = sentence_pair[i];
            let sentence_translate = sentence_pair[i]["sentence-translation"]
            sentenceArr.push({sentence, sentence_translate })
        }
        return sentenceArr
    }

    generateAudio = (req,res,next) => {
        const querys = req.query;
        let startDate, endDate
        if (!Object.keys(querys).length) {
            startDate = moment(); endDate = moment().add(1,"day");
        }
        connection.query(`SELECT * FROM new_word_manage WHERE create_time BETWEEN "${moment(startDate).format("YYYY-MM-DD")}" AND "${moment(endDate).format("YYYY-MM-DD")}"`, (err, result) =>{
            if (err) throw err;
            this.currentSearchedWord = result.map(({word,translated})=>({word, translated}))
            this.requestAudioFile((buffers) => {
                res.setHeader("Content-Type", "audio/mpeg");
                res.setHeader("Content-length", buffers.length);
                res.setHeader("Content-Disposition",`attachment;filename=${moment().format("YYYY-MM-DD")}.mp3`);
                res.send(buffers)
                next();
            })
        })
    }
}

export default new GenerateAudio() 