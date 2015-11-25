var http = require('http');
var qs = require('querystring');
var iconv = require('iconv-lite');
var fs = require('fs');
var async = require("async");

//url
var host_name = 'http://www.autohome.com.cn';
var car_brand_url = '/Ashx/HCarLinkage.ashx?OperType=GetCarLinkage&ApiUrl=http%3A%2F%2Fcar.api.autohome.com.cn%2Fv1%2Fjavascript%2Fbrand.ashx%3F_appid%3Dcms%26state%3D0X000C%26typeid%3D1';
//后面拼接车辆品牌的ID，以获取车辆型号
var car_model_url = '/Ashx/HCarLinkage.ashx?OperType=GetCarLinkage&ApiUrl=http%3A%2F%2Fcar.api.autohome.com.cn%2Fv1%2Fjavascript%2Fseriesbybrand.ashx%3F_appid%3Dcms%26typeid%3D1%26state%3D0X000C%26brandid%3D';
//后面拼接车辆型号的ID，以获取车辆款式
var car_type_url = '/Ashx/HCarLinkage.ashx?OperType=GetCarLinkage&ApiUrl=http%3A%2F%2Fcar.api.autohome.com.cn%2Fv1%2Fjavascript%2Fspecbyseries.ashx%3F_appid%3Dcms%26typeid%3D1%26state%3D0X000C%26seriesid%3D';
//后面拼接车辆款式的ID，获取该款车的所有信息，提取出车辆指导价格
var car_price_url = '/buycar/GetSpecDetail.ashx?id=';


    function get_car_brand(){

        var car_arr = [],   //存储车辆品牌
            _this = this;

        http.get(host_name + car_brand_url, function(res) {

            var body = '';

            res.setEncoding('binary');
            res.on('data', function(chunk){
                body += chunk;
            });

            res.on('end', function(){

                var buf = new Buffer(body,'binary');
                var str = iconv.decode(buf,'gbk');

                /**
                 *  [{
                 *      id : "fjsfjdks",
                 *      name : "fsjflkdsjflds" 奥迪
                 *  },
                 *  {
                 *      id : "fjsfjdks",
                 *      name : "fsjflkdsjflds" 奥迪
                 *  }]
                 */

                var obj = JSON.parse(str),
                    data = obj.result.branditems;

                var urls = [];
                var carInfos = [];
                for(var i=0, len=data.length; i<len; i++){

                    carInfos.push({
                        id : data[i].id,
                        name : data[i].name
                    });
                }
                var testCarInfo = [carInfos[0]];
                async.map(carInfos, get_car_model, function(error, model_arrs){
                    var module_array = [];
                    for(var i=0; i<model_arrs.length; i++){
                        module_array = module_array.concat(model_arrs[i]);
                    }
                    async.map(module_array, get_car_type, function(error, finalResults){
//                        console.log(finalResults);

                        var str = '';
                        for(var i= 0,len=finalResults.length; i<len; i++){
                            str += "\r\n" + finalResults[i].join("\r\n");
                        }

//                        console.log(str);
                        wirte_price_file('cars.csv', str);

                    });
                });

            });

        });
    }


    /**
     * 获取车辆的模型
     * @param data
     */
    function get_car_model(carInfo, callback){

        var car_brand_id = carInfo.id,
            url = host_name + car_model_url + car_brand_id,
            car_brand_name = carInfo.name;

        var model_arr = [];     //存储车辆型号

        http.get( url, function(res){
            var body = '';

            res.setEncoding('binary');
            res.on('data', function(chunk){
                body += chunk;
            });
            res.on('end', function(){

                var buf = new Buffer(body,'binary');
                var str = iconv.decode(buf,'gbk');



                var obj = JSON.parse(str),
                    data = obj.result.seriesitems;

                /**
                 *  [{
                 *      id : "fjsfjdks",
                 *      name : "fsjflkdsjflds" 奥迪A6
                 *  },
                 *  {
                 *      id : "fjsfjdks",
                 *      name : "fsjflkdsjflds" 奥迪Q7
                 *  }]
                 */

                for(var j=0, datalen=data.length; j<datalen; j++){
                    data[j].brand_model = car_brand_name + ',' + data[j].name;

                    model_arr.push(data[j]);

                }

                callback(null, model_arr);


            });
        });

    }

    /**
     * 获取车辆的款式
     * @param data
     */
    function get_car_type(car_type_info, callback) {

        var type_arr = [],     //存储车辆款式
            _this = this,
            index = 0;
        var car_type_id = car_type_info.id,
            url = host_name + car_type_url + car_type_id,
            brand_model_type = car_type_info.brand_model,
            successStr = [];

        http.get( url, function(res){
            var body = '';

            res.setEncoding('binary');
            res.on('data', function(chunk){
                body += chunk;
            });

            res.on('end', function(){

                var buf = new Buffer(body,'binary');
                var str = iconv.decode(buf,'gbk');

                var obj = JSON.parse(str),
                    type = obj.result.specitems,
                    success = [];

                /**
                 *  [{
                         *      id : "fjsfjdks",
                         *      name : "fsjflkdsjflds" 奥迪A6,
                         *      maxprice : jfjslf
                         *      minprice : jflsjflkd
                         *  },
                 *  {
                         *      id : "fjsfjdks",
                         *      name : "fsjflkdsjflds" 奥迪Q7
                         *  }]
                 */

                for(var j=0, typeLen=type.length; j<typeLen; j++){
                    success.push(brand_model_type + ',' + type[j].name + ',' + type[j].maxprice + '元');

                }

                callback(null, success);

            });

            res.on('error', function (e) {
                callback(e, null);
            })

        });

    }

    /**
     * 把数据写入文件
     * @param fileName
     * @param data
     */
    function wirte_price_file(fileName, data) {

        //write file
        fs.writeFile(fileName, data, function(err){
            console.log(err);
        });
    }

    get_car_brand();
