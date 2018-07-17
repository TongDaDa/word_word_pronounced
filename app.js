import express from 'express';
import routes from './routes';
import config from 'config-lite';
import path from 'path';
import orm from 'orm';

const mysql      = require('mysql');
const opts = {
    host     : '39.107.66.37',
    user     : 'root',
    port     : '3306',
    protocol: 'mysql',
    password : 'liutong123',
    database : 'lws'
}

const connection = mysql.createConnection(opts);
 
// jdbc\:mysql\://39.107.66.37/lws?useUnicode\=true&characterEncoding\=utf-8

const bodyParser = require('body-parser');
const app = express();
const ejs = require("ejs");

connection.connect();

app.all("*",(req,res,next)=>{
    const origin = req.headers.origin || "*";
    res.header("Access-Control-Allow-Origin", origin);
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  	res.header("Access-Control-Allow-Credentials", true); //可以带cookies
    res.header("X-Powered-By", '3.2.1');
    //asds
    if(req.method === "OPTION"){
        res.send(200);
    } else{
        next();
    }
});

// 设置模板目录
app.set('views', path.join(__dirname, 'views'));
// 设置模板引擎为 ejs
app.set('view engine', 'ejs');

app.use(orm.express(opts, {
    define: function (db, models, next) {
        models.user = db.define("user", { id: Number, user_name: String, account: Number, email: String});
        models.new_word_manage = db.define("new_word_manage", { id: Number, create_time: Date, word: String, translated: String});
        next();
    }
}))

routes(app);

app.use(express.static("./public"));

/**
 * 
 *   mongosdb
 */
app.listen(config.port,() => {
    console.log(`已经监听在 ${ config.port } 端口`) 
});

export { connection, opts }