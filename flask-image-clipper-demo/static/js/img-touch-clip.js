/*
=================================
img-touch-canvas - v0.1
http://github.com/rombdn/img-touch-canvas

(c) 2013 Romain BEAUDON
This code may be freely distributed under the MIT License
=================================
*/


(function() {
    var root = this; //global object

    var ImgTouchCanvas = function(options) {
        if( !options || !options.canvas) {
            throw 'ImgZoom constructor: missing arguments canvas or path';
        }
     
        this.canvas         = options.canvas;
        this.canvas.width   = this.canvas.clientWidth;
        this.canvas.height  = this.canvas.clientHeight;
        this.context        = this.canvas.getContext('2d');

        this.desktop = options.desktop || false; //non touch events
        console.log("canvs-client-w",parseInt(this.canvas.clientWidth));//750  可理解为实际的宽度


      // DrawMapInfo(
           //     this.scale.x * this.scaleAdaption,                 //宽高的放大缩小量
           //     this.scale.y * this.scaleAdaption, 
           //     this.position.x + this.positionAdaption.x,         //off_x,x坐标的偏移量
           //     this.position.y + this.positionAdaption.y);
        this.position = {
            x: 0,
            y: 0
        };
        this.img_y=0;
        this.scale = {
            x: 0.5,
            y: 0.5
        };
        this.box_Scale=1;
//options.path改写为options.image----->使用传进来的image

       // this.imgTexture.src = options.path;

//从canvas-zoom迁移过来，关于边框等元素的adaption的设置
        this.scaleAdaption = 1;

        var indoormap =options.canvas;
        var pageWidth = parseInt(indoormap.getAttribute("width"));  //750
        var pageHeight = parseInt(indoormap.getAttribute("height"));//1180
        
        currentWidth = document.documentElement.clientWidth;  //value 414
        currentHeight = document.documentElement.clientHeight;//value 736
        console.log("currentWidth",currentWidth);
        console.log("pageWidth",pageWidth);
        
        var offsetX = 0;
        var offsetY = 0;
        if (pageWidth < pageHeight) {//canvas.width < canvas.height
            this.scaleAdaption = currentHeight / pageHeight;
            if (pageWidth * this.scaleAdaption > currentWidth) {
                this.scaleAdaption = this.scaleAdaption * (currentWidth / (this.scaleAdaption * pageWidth));
            }
        } else {//canvas.width >= canvas.height
            this.scaleAdaption = currentWidth / pageWidth;
            if (pageHeight * this.scaleAdaption > currentHeight) {
                this.scaleAdaption = this.scaleAdaption * (currentHeight / (this.scaleAdaption * pageHeight));
            }
        }

        console.log("scaleAdaption",this.scaleAdaption);   //0.552
        console.log("currentHeight",currentHeight);        //736
        this.positionAdaption = {
            x: (parseInt(currentWidth) - parseInt(indoormap.getAttribute("width"))) / 2,
            y: (parseInt(currentHeight) - parseInt(indoormap.getAttribute("height"))) / 2
        };
        console.log("positionada-x:",this.positionAdaption.x);   //-168
        console.log("positionada-y:",this.positionAdaption.y);   //-222
        
//end
        this.imgTexture = new Image();

        this.lastZoomScale = null;
        this.lastX = null;
        this.lastY = null;

        this.mdown = false; //desktop drag

        this.init = false;
        this.checkRequestAnimationFrame();
        requestAnimationFrame(this.animate.bind(this));
       // requestAnimationFrame(this.draw_box.bind(this));
        //this.init_draw();
        this.setEventListeners();
    };


    ImgTouchCanvas.prototype = {
        _imgBoxSize:750,
        _imgBox:null,
        _previewBox:null,
        _uploadInputBtn:null,

        _$canvas:null,
        _$canvasW:0,
        _$canvasH:0,
        _$canvas2d:null,

        _imgScale:0,

       // _img:this.imgTexture,
        //剪裁的x y坐标
        _img_sx:0,
        _img_sy:0,
        // 图片的高宽
        _imgW:0,
        _imgH:0,
        init_url: function(url){
            this.imgTexture = new Image();
            this.imgTexture.src=url;
            this.init=false;
            this.box_Scale=1;
             this.position = {
            x: 0,
            y: 0
            };
            this.img_y=0;
            this.scale = {
                x: 0.5,
                y: 0.5
            };
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.animate();
            console.log(url);
        },

        animate: function() {
            //set scale such as image cover all the canvas

            if(!this.init) {
                if(this.imgTexture.width) {
                    var scaleRatio = null;
                    //检测图片的宽高比例
                    var w_h_ratio=this.imgTexture.width/this.imgTexture.height;
                    if(this.canvas.clientWidth <= this.canvas.clientHeight) {
                        scaleRatio = this.canvas.clientWidth / this.imgTexture.width;
                    }
                    else {
                        scaleRatio = this.canvas.clientHeight / this.imgTexture.height;
                    }
                  
                    this.img_y=this.canvas.height/2-this.imgTexture.height*scaleRatio/2;
                    this.position.y=this.img_y;
                    this.scale.x = scaleRatio;
                    this.scale.y = scaleRatio;
                    this.init = true;

                    console.log("init:",this.init ,this.scale.x);

                }
            }
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.context.drawImage(
                this.imgTexture, 
                this.position.x, this.position.y, 
                this.scale.x * this.imgTexture.width, 
                this.scale.y * this.imgTexture.height);

             DrawMapInfo(
                this.box_Scale,
                this.scale.y,
                this.position.x,
                this.position.y);
            requestAnimationFrame(this.animate.bind(this));
        },

        gesturePinchZoom: function(event) {
            var zoom = false;

            if( event.targetTouches.length >= 2 ) {
                var p1 = event.targetTouches[0];
                var p2 = event.targetTouches[1];
                //两个touch_X坐标的绝对值 
                var zoomScale = Math.sqrt(Math.pow(p2.pageX - p1.pageX, 2) + Math.pow(p2.pageY - p1.pageY, 2)); //euclidian distance

                if( this.lastZoomScale ) {
                    zoom = zoomScale - this.lastZoomScale;
                }
                this.lastZoomScale = zoomScale;
            }    
            return zoom;
        },

        doZoom: function(zoom) {
            if(!zoom) return;
            
            //new scale
            var currentScale = this.scale.x;
            var newScale = this.scale.x + zoom/100;
            var box_Scale = this.box_Scale  + zoom/100;
            //var newzoom
            console.log("zoom",zoom/100);
            var img_y=this.img_y;
            //some helpers
            var deltaScale = newScale - currentScale;
            var currentWidth    = (this.imgTexture.width * this.scale.x);
            var currentHeight   = (this.imgTexture.height * this.scale.y);
            //deltaWidth===》detascale缩放差
            var deltaWidth  = this.imgTexture.width*deltaScale;
            var deltaHeight = this.imgTexture.height*deltaScale;
            console.log("detalwidth",deltaWidth);
            //by default scale doesnt change position and only add/remove pixel to right and bottom
//默认的缩放不会改变定位，只会添加/移除像素，到左边或底部
            //so we must move the image to the left to keep the image centered
//所以我们必须移动图像到左边以保持图像的中心化
            //ex: coefX and coefY = 0.5 when image is centered <=> move image to the left 0.5x pixels added to the right
//coefX和coefY赋值为0.5当图像在中心时，移动图像到左边的0.5像素，

//canvasmiddleX——取得canvas的中心点
            var canvas_middle_X = this.canvas.clientWidth / 2;
            var canvas_middle_Y = this.canvas.clientHeight / 2;
//
            var xonmap = (-this.position.x) + canvas_middle_X;
            var yonmap = (-this.position.y) + canvas_middle_Y;
            var coefX = -xonmap / (currentWidth);
            var coefY = -yonmap / (currentHeight);

            var newPosX = this.position.x + deltaWidth*coefX;
            var newPosY = this.position.y + deltaHeight*coefY;
           // console.log("new_posy",newPosX);
            //edges cases
           var newWidth = currentWidth + deltaWidth;
           var newHeight = currentHeight + deltaHeight;
           
           if( newWidth < this.canvas.clientWidth ) return;
           if( newPosX > 0 ) { newPosX = 0; }
           if( newPosX + newWidth < this.canvas.clientWidth ) {
                newPosX = this.canvas.clientWidth - newWidth;
            }
           console.log("new_posy",newPosY);
           console.log("newHeight",newHeight);
           console.log("newPosY + newHeight",newPosY + newHeight);
          // if( newHeight < this.canvas.clientHeight ) return;
           if( newPosY >  this.img_y) { newPosY = this.img_y; }
        //    if( newPosY + newHeight < this.canvas.clientHeight ) { 
        //      newPosY = this.imgTexture.height - newHeight; }
     
        //   console.log("new_posy",newPosX);


 //最终效果并初始赋值    //finally affectations
            this.box_Scale  = box_Scale;
            this.scale.x    = newScale;
            this.scale.y    = newScale;
            this.position.x = newPosX;
            this.position.y = newPosY;
            console.log("newScale:",box_Scale);

        },
//平移
        doMove: function(relativeX, relativeY) {
            if(this.lastX && this.lastY) {
              var deltaX = relativeX - this.lastX;
              var deltaY = relativeY - this.lastY;
              var currentWidth = (this.imgTexture.width * this.scale.x);
              var currentHeight = (this.imgTexture.height * this.scale.y);

              this.position.x += deltaX;
              this.position.y += deltaY;
 //domve--->edge cases
              if( this.position.x > 0 ) {
                this.position.x = 0;
              }
              else if( this.position.x + currentWidth < this.canvas.clientWidth ) {
                this.position.x = this.canvas.clientWidth - currentWidth;
              }


              if(currentHeight >= this.canvas.clientHeight){
              if( this.position.y >0 ) {
                this.position.y = 0;
                
              }
              else if(this.position.y + currentHeight < this.canvas.clientHeight) {
                  this.position.y = this.canvas.clientHeight - currentHeight;
                  
              }
              }else{
                if(this.position.y >this.img_y){
                    this.position.y =this.img_y;
                  }else if(this.position.y + currentHeight < (this.canvas.clientHeight-this.img_y)) {
                    this.position.y = this.canvas.clientHeight - currentHeight-this.img_y;
                }
              }
            }

            this.lastX = relativeX;
            this.lastY = relativeY;
        },

        setEventListeners: function() {
            // touch
//监听touchstart事件，初始化变量 
            this.canvas.addEventListener('touchstart', function(e) {
                this.lastX          = null;
                this.lastY          = null;
                this.lastZoomScale  = null;
            }.bind(this));

            this.canvas.addEventListener('touchmove', function(e) {
                e.preventDefault();
//放大缩小 zoom功能
                if(e.targetTouches.length == 2) { //pinch
                    this.doZoom(this.gesturePinchZoom(e));
                }
//平移功能 ，获取传入 relativeX，relativeY的相对平移量
                else if(e.targetTouches.length == 1) {
                    var relativeX = e.targetTouches[0].pageX - this.canvas.getBoundingClientRect().left;
                    var relativeY = e.targetTouches[0].pageY - this.canvas.getBoundingClientRect().top;                
                    this.doMove(relativeX, relativeY);
                }
            }.bind(this));

            if(this.desktop) {
                // keyboard+mouse
                window.addEventListener('keyup', function(e) {
                    if(e.keyCode == 187 || e.keyCode == 61) { //+
                        this.doZoom(5);
                    }
                    else if(e.keyCode == 54) {//-
                        this.doZoom(-5);
                    }
                }.bind(this));

                window.addEventListener('mousedown', function(e) {
                    this.mdown = true;
                    this.lastX = null;
                    this.lastY = null;
                }.bind(this));

                window.addEventListener('mouseup', function(e) {
                    this.mdown = false;
                }.bind(this));

                window.addEventListener('mousemove', function(e) {
                    var relativeX = e.pageX - this.canvas.getBoundingClientRect().left;
                    var relativeY = e.pageY - this.canvas.getBoundingClientRect().top;

                    if(e.target == this.canvas && this.mdown) {
                        this.doMove(relativeX, relativeY);
                    }

                    if(relativeX <= 0 || relativeX >= this.canvas.clientWidth || relativeY <= 0 || relativeY >= this.canvas.clientHeight) {
                        this.mdown = false;
                    }
                }.bind(this));
            }
        },

        checkRequestAnimationFrame: function() {
            var lastTime = 0;
            var vendors = ['ms', 'moz', 'webkit', 'o'];
            for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
                window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
                window.cancelAnimationFrame = 
                  window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
            }

            if (!window.requestAnimationFrame) {
                window.requestAnimationFrame = function(callback, element) {
                    var currTime = new Date().getTime();
                    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                    var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
                      timeToCall);
                    lastTime = currTime + timeToCall;
                    return id;
                };
            }

            if (!window.cancelAnimationFrame) {
                window.cancelAnimationFrame = function(id) {
                    clearTimeout(id);
                };
            }
        }
    };

    root.ImgTouchCanvas = ImgTouchCanvas;
}).call(this);