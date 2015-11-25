/**
 * HTTP示例
 * @param  {[type]} 'http' [description]
 * @return {[type]}        [description]
 */
var http = require('http');
var url = require('url');
var util = require('util');
var querystring = require('querystring');

var server = http.createServer(function(req,res){
    console.log(req.method);//获取请求的方法
    console.log(req.headers);//获取请求头
    console.log(req.url);//获取请求的url
});
server.listen(8088);

server.on('connection',function(){
    console.log('connection');
});
server.on('error',function(err){
    console.log('error');
});
server.on('close',function(){
    console.log('close');
});
server.on('error',function(){
    console.log('close');
});
server.setTimeout(3000,function(){
    console.log('timeout');
});
