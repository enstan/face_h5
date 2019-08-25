bindCanvas:function(){
    var self=this;
    var zoomSize=10;
    //放大缩小函数
    function zoomInOut(setSize,zoomFlag){
        var size;
        if(zoomFlag===true){
            size=setSize;
            self._img_sx=self._img_sx-setSize/2;
            self._img_sy=self._img_sy-setSize/2;
        }else{
            //缩小的时候进行检测 _img_sx _img_sy 以免让图片缩小到检测框大小以内
            if(self._img_sx>=(self._$canvasW - self._imgCropSize)/2){
                return false;
            }
            if((-self._img_sx+(self._$canvasW - self._imgCropSize)/2+self._imgCropSize)>=self._imgW){
                return false;
            }
            if((-self._img_sy+(self._$canvasH - self._imgCropSize)/2+self._imgCropSize)>=self._imgH){
                return false;
            }
            if(self._img_sy>=(self._$canvasH - self._imgCropSize)/2){
                return false;
            }
            //self._img_sx 减去(self._$canvasW- self._imgCropSize)/2 的值小于
            if((self._$canvasW- self._imgCropSize)/2-self._img_sx<zoomSize){
                return false;
            }
            if((self._$canvasH- self._imgCropSize)/2-self._img_sy<zoomSize){
                return false;
            }

            size=-setSize;
            self._img_sx=self._img_sx+setSize/2;
            self._img_sy=self._img_sy+setSize/2;
        }
        self._imgW=self._img.width+size;
        self._imgH=self._imgW/self._imgScale;
        self._img.width=self._imgW;
        self._img.height=self._imgH;
        // 清除上一次绘制的图片区域
        self.clearCanvas();
        
        //绘制新的图片区域
        self._$canvas.ctx.drawImage(self._img,self._img_sx,self._img_sy,self._imgW,self._imgH);
        //绘制canvas上的遮罩层
        self.drwaShade();
//绘制剪裁的canvascrop
        
        self.drawCanvasCrop();
//绘制预览的canvaspreview
        self.drawCanvasPreview();
    }
    // jquery 兼容的滚轮事件
    $(document).on("mousewheel DOMMouseScroll",''+self._imgBox.selector+'', function (e) {

        var delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) ||  // chrome & ie
            (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));              // firefox

        if (delta > 0) {
            // 向上滚
            zoomInOut(zoomSize,true);
        } else if (delta < 0) {
            // 向下滚
            // console.log("wheeldown");
            zoomInOut(zoomSize,false);
        }
//                window.event.returnValue=false;
        return false;
    });

    //绑定事件
    var mouseTag=false;
    //鼠标上一次的X,Y值用于实时计算鼠标移动的偏移量
    var prevX=0,prevY=0;
    self._imgBox.on({
        mousedown:function(e){
            mouseTag=true;
            //按下的时候记录第一个坐标值
            prevX=e.pageX;
            prevY=e.pageY;
        },
        mouseup:function(){
            mouseTag=false;
        },
        //修复了 按下鼠标拖出元素外以后再次回来还是按下mousedown的状态
        //解决方案 鼠标移出元素外 那么就更改状态为mouseup状态
        mouseleave:function(){
            mouseTag=false;
        },
        mousemove:function(e){
            if(!mouseTag) return false;
            //获取偏移量 重新绘制canvas
            var cX=e.pageX-prevX;
            var cY=e.pageY-prevY;
            // console.log(cX+"-"+cY);
            //更新prevX prevY
            prevX=e.pageX;
            prevY=e.pageY;
            //更新self._img_sx self._img_sy
            self._img_sx+=cX;
            self._img_sy+=cY;
            // 检测_img_sx _img_sy 不让图片移除剪裁框范围以内
            self.checkCanvasXY();
            // 清除上一次绘制的图片区域
            self.clearCanvas();
            //绘制新的图片区域
            self._$canvas.ctx.drawImage(self._img,self._img_sx,self._img_sy,self._imgW,self._imgH);
            // 绘制canvas上的遮罩层
            self.drwaShade();
            // 绘制剪裁的canvas
            self.drawCanvasCrop();
            //绘制预览的canvas
            self.drawCanvasPreview();+
            
        }
    });
},