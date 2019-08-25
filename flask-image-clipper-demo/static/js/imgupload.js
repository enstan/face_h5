+function($){
    "use strict";
    var Imgupload=function(opt,saveCallBack){
        this._imgBoxSize=opt.imgBoxSize;
        this._imgCropSize=opt.imgCropSize;
        this._imgPreSize=opt.previewBoxSize;
        this._uploadInputBtn=$(opt.uploadInputBtn);
        this._imgBox=$(opt.imgBox);
        this._previewBox=$(opt.previewBox);
        this._init();
    }
   // var gesturableImg='';

    Imgupload.prototype={
        constructor:Imgupload,
        _imgBoxSize:0,
        _imgBox:null,
        _previewBox:null,
        _uploadInputBtn:null,

        _$canvas:null,
        _$canvasW:0,
        _$canvasH:0,
        _$canvas2d:null,

        _imgScale:0,

        _img:null,
        //剪裁的x y坐标
        _img_sx:0,
        _img_sy:0,
        // 图片的高宽
        _imgW:0,
        _imgH:0,
        action:'',
        _init:function (){
            var self=this;
            self.initCanvas();
            self.readFile();
            $(".test_menu li").click(function(){
                self.action= $(this).find("label").attr("htmlfor");
                self.save();
            });

        },
        //初始化图片容器，预览容器
        initCanvas:function(){
            var self=this;
            //设置图片容器高宽
            self._imgBox.css({
                "width":self._imgBoxSize,
                "height":1200
            });
            self._$canvasW=self._imgBoxSize;
            self._$canvasH=1200;
            self._$canvas=document.getElementById("mycanvas");
            //self._$canvas =$("<canvas id='mycanvas'" +
            //    'width="' + self._$canvasW  + '"height="' + 1180 + '">' +
            //    '</canvas>');
            self._imgBox.append(self._$canvas);
            self._$canvas.ctx = self._$canvas.getContext('2d');
            // 绘制canvas上的遮罩层

             self.drwaShade();

        },
//!!读取图片
        readFile:function(){
            var self=this;
//检测浏览器 是否支持fileread               
            if(typeof FileReader==='undefined'){
                alert("当前浏览器较老，请升级到最新版本或者更换浏览器！");
            }else{
//获取图片的element元素监听change事件，读取文件                 
                self._uploadInputBtn[0].addEventListener('change', readFile, false);
                self._uploadInputBtn[1].addEventListener('change', readFile, false);
            }
            function readFile(){
//赋值到file（检测文件必须为图片格式），
                var file = this.files[0];
                console.log(file);
                if(!/image\/\w+/.test(file.type)){

                    alert("文件必须为图片！");
                    return false;
                }

//将文件存为data_url格式，邦定到生成预览图等方法 
                var reader = new FileReader();

                reader.readAsDataURL(file);
//其他reader方法：
//http://blog.sina.com.cn/s/blog_13f8261eb0102x0nt.html
//获取url路径方法https://www.cnblogs.com/fqh123/p/10958871.html
                var url = null;
                if (window.createObjectURL != undefined) {
                    // basic
                    url = window.createObjectURL(file);
                } else if (window.URL != undefined) {
                    // mozilla(firefox)
                    url = window.URL.createObjectURL(file);
                } else if (window.webkitURL != undefined) {
                    // webkit or chrome
                    url = window.webkitURL.createObjectURL(file);
                }
//gesturable  传入图片路径,同时清空数组
                // self.gesturableImg.init(url);
                MAPINFO.splice(0,MAPINFO.length);
                console.log('imgup',MAPINFO.length);
                gesturableImg.init_url(url);
                console.log('gest',gesturableImg);
                //file_change && file_change(self._$canvas[0],url);
                
                reader.onload = function(e){
                    self.buildBox(this.result);
                    //self.bindCanvas();
                }
            }
        },
        //生成预览图
        buildBox:function(src){
            var self=this;
            // self._imgBox.empty();
            self._img=new Image();
            self._img.src = src;
            self._img.onload=function(){
               // drawImg();
//定义一个file_change的回调函数,---》(canvas标签，读取的图片地址结果)，返回给img-touch使用
            };
        },
         //清除画布
        clearCanvas:function () {
            if(this._$canvas){
                this._$canvas.ctx.clearRect(0, 0, this._$canvasW,this._$canvasH);
            }
        },
        // 绘制canvas上的遮罩层
        drwaShade:function(){
            this._$canvas.ctx.beginPath();
            this._$canvas.ctx.fillStyle="rgba(0,0,0,0.3)";
            this._$canvas.ctx.fillRect(0, 0, this._$canvasW, this._$canvasH);
        },

        save:function(){
//！！将canvaspreview---转成dataurl————>回调给savecallback函数            
            var base64Url =this._$canvas.toDataURL('image/png').replace('data:image/png;base64,', '');
            saveCallBack && saveCallBack(base64Url,this.action);
        }

    }
    window.Imgupload = Imgupload;
}(jQuery);
