"use strict";

import mongoose from 'mongoose';
import AccountModel from '../../models/account';
import { debug } from 'util';

class Account {
    login(req,res,next){
        const {username,password} = req.body;
        res.setHeader("Content-type","application/json;charset=UTF-8");
        if(String(username) && password){
            //查询数据库
            AccountModel.find({user:username},(err,docs)=>{
                if(!err){ console.error(err); return; }
                if(!docs || docs.length < 1){
                   req.send(JSON.stringify({status:'success',message:'用户名密码错误'}))
                }else{
                   //种token
                   console.log(docs)
                }
            });
        }else{
            res.send(JSON.stringify({status:"error",messages:"参数错误"}));
        }
    };
    register(req,res,next){
        const addCities = new CitiesModel({ name,uid,message,phone });
        addCities.save((err,doc)=>{
            if(err){ return err; };
            res.send(doc);
            next();
        })
    };
    setPassword(req,res,next){
        next();
    };
}

export default new Account();