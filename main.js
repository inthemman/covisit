let model,mySwiper,drawOff;
const loadScreen = document.getElementById("loading");
const camScreen = document.getElementById("camera");
const infoScreen = document.getElementById("info");
const canvas = document.querySelector('#canvas');
const context = canvas.getContext('2d');

let deviceCache,charCache,valueCache,decoded,temp=null;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const video = document.querySelector('video');
const size = {
    w : 640,
    h: 480,
    s : 224,
}

function log(data) {
    loadScreen.innerHTML += "<br>" + data;
}
async function load() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('./fmodel')
    drawOff = false;
    model = await tf.loadLayersModel('./maskmaybe/model.json');
    log("Model Loaded")
    stream = await navigator.mediaDevices.getUserMedia({video:true});
    

    mySwiper = new Swiper('.swiper-container',{
        allowTouchMove : false,
        preventClicks : false,
        preventClicksPropagation: false
    });

    setTimeout(()=>{
        loadCamera(stream); 
        canvas.addEventListener("click",async () => {
            // stopped = 1;
            context.drawImage(video,0,0,size.w,size.h);
            context.beginPath();
            context.lineWidth = 1;
            context.strokeStyle = "red";
            context.rect((size.w-224)/2 - 1,(size.h-224)/2 - 1,226,226);
            context.stroke();
            myFace = document.createElement("canvas");
            myFace.width = 224;
            myFace.height = 224;
            myFace.getContext("2d").drawImage(canvas,(size.w-224)/2,(size.h-224)/2,224,224,0,0,224,224);
            const detection = await faceapi.detectSingleFace(myFace,new faceapi.SsdMobilenetv1Options({minConfidence : 0.1}));
            let faceFully
            if(detection) {
                console.log(detection);
                if(detection.score > 0.65) {
                    faceFully = true;
                } else {
                    faceFully = false;
                }
            } else {
                console.log("why no")
            }
            // console.log(detection.score);
            // let faceDetected = detection.score > 0.5;
            isMasked = await idDetect(myFace);
            let masked= isMasked[0] > 0.8;
            if(masked && detection && !faceFully) {
                unloadCamera(stream);
                document.getElementById('check').innerText = isMasked[0] + ' ' + isMasked[1] + "Mask!!"
                document.getElementById('check').appendChild(myFace);
                mySwiper.slideNext();
            } else {
                document.getElementById('check').innerText = isMasked[0] + ' ' + isMasked[1] + "No Mask!! or No face"
                document.getElementById('check').appendChild(myFace);
                if(charCache) {
                    charCache.writeValue(encoder.encode("no"));
                }
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
    let reg = /^\d{10,11}$/;
    let phoneVal = document.getElementById('phone').value;
    let rsVal = document.getElementById('rs').value;
    if(!phoneVal || !rsVal) {
        alert("모든 정보를 입력해야합니다!");
    } else if(!reg.exec(phoneVal)) {
        alert("전화번호를 제대로 입력해야합니다!")
    } else if(!rsVal.endsWith("구") && !rsVal.endsWith("동")) {
        alert("구나 동으로 주소가 끝나야합니다!")
    } else {
        mySwiper.slideNext();
        db.visitors.put({
            date : new Date(),
            tel : phoneVal,
            resi : rsVal,
            temp : temp
        }).then(() => {
            console.log("GOOD VISITORS");
            return db.visitors.each(vis => console.log(vis));
        })
        if(charCache) {
            charCache.writeValue(encoder.encode("pass"));
        }
        document.getElementById('phone').value = '';
        document.getElementById('rs').value = '';
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
                } else if(decoded =="XXX") {
                    if(mySwiper.realIndex == 3) {
                        document.getElementById('good').click();
                    }
                } else if(parseFloat(decoded)) {
                    document.getElementById('temp').innerText = decoded;
                    temp = decoded;
                }
            })
        })
        console.log(charCache)
        charCache.writeValue(encoder.encode("done"));
    }).catch(err => {
        log("오류 : " + err);
        console.log(err);
    })
    load();
});
