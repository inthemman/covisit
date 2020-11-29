function canvasSrc(url) {
    return new Promise((resolve,reject) => {
        const image = new Image();
        image.src = url;
        image.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = this.width;
            canvas.height = this.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(this, 0, 0);
            // console.log(ctx.getImageData(0,0,this.width,this.height));
            resolve(ctx.getImageData(0,0,this.width,this.height));
        };
        image.onerror = function () {
            reject(this);
        }
    })
}
async function idDetect(imageData) {
    if(!model) {
        const model = await tf.loadLayersModel('./mask_js/model.json');
    }
    
    // let a = tf.browser.fromPixels(await canvasSrc("http://localhost:3001/images/resizen.jpg"));
    let image = tf.browser.fromPixels(imageData)
    resized = tf.image.resizeBilinear(image,[224,224]);
    const b = tf.scalar(127.5);

    const preped = resized.div(b).sub(tf.scalar(2));

    image.dispose();
    b.dispose();

    const magic = model.predict(preped.expandDims(0))

    return await magic.data()
}