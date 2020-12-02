let model,mySwiper,drawOff;
const loadScreen = document.getElementById("loading");
const camScreen = document.getElementById("camera");
const infoScreen = document.getElementById("info");
const canvas = document.querySelector('#canvas');
const context = canvas.getContext('2d');

let deviceCache,charCache,valueCache,decoded;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const video = document.querySelector('video');
const size = {
    w : 480,
    h: 640,
    s : 224,
}

function log(data) {
    loadScreen.innerHTML += "<br>" + data;
}
async function load() {
    drawOff = false;
    model = await tf.loadLayersModel('./mask_js/model.json');
    log("Model Loaded")
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
            myFace.getContext("2d").drawImage(canvas,(size.w-224)/2,(size.h-224)/2,224,224,0,0,224,224);
            isMasked = await idDetect(myFace);
            let masked= isMasked[0] > isMasked[1];
            if(masked) {
                unloadCamera(stream);
                charCache.writeValue(encoder.encode("pass"))
                document.getElementById('check').innerText = isMasked[0] + ' ' + isMasked[1] + "Mask!!"
                document.getElementById('check').appendChild(myFace);
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
        if(drawOff) return false;
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
    video.pause();
    video.removeAttribute('src');
}
document.getElementById("pass").addEventListener("click",() => {
    if(!document.getElementById('agree').checked) {
        alert("개인 정보 수집에 동의해주세요.");
    } else {
        mySwiper.slideNext();
    }
});
document.getElementById("good").addEventListener("click",()=>{
    mySwiper.slideTo(1);
    loadCamera(stream);
    document.getElementById('check').innerHTML = "";
})
loading.addEventListener("click",async () => {
    loading.style.backgroundColor = "red";
    // serviceUUID 0xFFE0 characteristic 0xFFE1
    serviceUuid = 0xFFE0;
    charUuid = 0xFFE1;
    hi = await navigator.bluetooth.requestDevice({
        filters : [{services:[0xFFE0]}]
    }).then(device => {
        log("GATT SERVER에 연결중...")
        return device.gatt.connect();
    }).then(server => {
        log("SERVICE 연결중...");
        return server.getPrimaryService(serviceUuid);
    }).then(service => {
        log("CHAR 연결중...");
        return service.getCharacteristic(charUuid);
    }).then(characteristic => {
        log('> Characteristic UUID:  ' + characteristic.uuid);
        log('> Broadcast:            ' + characteristic.properties.broadcast);
        log('> Read:                 ' + characteristic.properties.read);
        log('> Write w/o response:   ' + characteristic.properties.writeWithoutResponse);
        log('> Write:                ' + characteristic.properties.write);
        log('> Notify:               ' + characteristic.properties.notify);
        log('> Indicate:             ' + characteristic.properties.indicate);
        log('> Signed Write:         ' + characteristic.properties.authenticatedSignedWrites);
        log('> Queued Write:         ' + characteristic.properties.reliableWrite);
        log('> Writable Auxiliaries: ' + characteristic.properties.writableAuxiliaries);
        charCache = characteristic;
        charCache.startNotifications().then(_ => {
            charCache.addEventListener("characteristicvaluechanged",(e) => {
                valueCache = e.target.value;
                decoded = decoder.decode(valueCache);
                console.log(decoded);
                console.log("---------------------------")
                if(decoded == "cap") {
                    if(mySwiper.realIndex == 1) {
                        canvas.click();
                    }
                } else if(decoded =="xxx") {
                    if(mySwiper.realIndex == 3) {
                        document.getElementById('good').click();
                    }
                }
            })
        })
        console.log(charCache)
    }).catch(err => {
        log("오류 : " + err);
        console.log(err);
    })
    load();
});

