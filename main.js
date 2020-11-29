let model,mySwiper;
const loadScreen = document.getElementById("loading");
const camScreen = document.getElementById("camera");
const infoScreen = document.getElementById("info");
const canvas = document.querySelector('#canvas');
const context = canvas.getContext('2d');

const video = document.querySelector('video');
const size = {
    w : 640,
    h: 480,
    s : 224,
}

async function load() {
    model = await tf.loadLayersModel('./mask_js/model.json');
    loadScreen.appendChild(document.createTextNode("Model loaded"));
    stream = await navigator.mediaDevices.getUserMedia({video:true});

    mySwiper = new Swiper('.swiper-container',{
        allowTouchMove : false
    });
    setTimeout(()=>{
        loadCamera(stream); 
        canvas.addEventListener("click",async () => {
            // stopped = 1;
            context.drawImage(video,0,0,size.w,size.h);
            context.beginPath();
            context.rect((size.w-224)/2,(size.h-224)/2,224,224);
            context.stroke();
            myFace = document.createElement("canvas");
            myFace.width = 224;
            myFace.height = 224;
            myFace.getContext("2d").drawImage(video,(size.w-224)/2,(size.h-224)/2,224,224,0,0,224,224);
            isMasked = await idDetect(myFace);
            let masked= isMasked[0] > isMasked[1];
            if(masked) {
                unloadCamera(stream);
                mySwiper.slideNext();
            } else {
                document.getElementById('check').innerText = isMasked[0] + ' ' + isMasked[1] + "No Mask!!"
                document.getElementById('check').appendChild(myFace);
            }
        })
        mySwiper.slideNext();
    },1000);
}
async function loadCamera(stream) {
    async function draw(video,width,height){
        context.drawImage(video,0,0,width,height);
        context.beginPath();
        context.rect((width-224)/2,(height-224)/2,224,224);
        context.stroke();
        
        setTimeout(draw,10,video,width,height)
    }
    video.addEventListener("play",() => {
        canvas.height = size.h;
        canvas.width = size.w;
        draw(video,size.w,size.h);
    })
    video.srcObject = stream;
    video.play();
    
}
async function unloadCamera(stream) {
    stream.getTracks().forEach( (track) => {
        track.stop();
    });
    video.pause();
    video.removeAttribute('src');
}
document.getElementById("pass").addEventListener("click",() => {
    if(document.getElementById('agree').checked) {
        mySwiper.slideNext();
    } else {
        alert("개인 정보 수집에 동의해주세요");
    }
})

load();
