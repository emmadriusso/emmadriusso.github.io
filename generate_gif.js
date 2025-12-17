const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function run(){
    const htmlPath = path.resolve(__dirname, 'assets', 'script', 'rain-widget.html');
    if(!fs.existsSync(htmlPath)){
        console.error('Missing file:', htmlPath);
        process.exit(1);
    }

    const browser = await puppeteer.launch({args:['--disable-infobars']});
    const page = await browser.newPage();

    const url = 'file://' + htmlPath.replace(/\\/g, '/');
    await page.goto(url, {waitUntil: 'networkidle2'});

    // wait until widget reports size
    await page.waitForFunction('window.__rainWidget && window.__rainWidget.size && window.__rainWidget.size().w > 0');
    const size = await page.evaluate(()=> window.__rainWidget.size());

    console.log('Widget size:', size);
    await page.setViewport({width: size.w, height: size.h});

    const framesDir = path.resolve(__dirname, 'frames');
    if(!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);

    const fps = 30;
    const durationSeconds = 4; // change this for longer GIFs
    const totalFrames = Math.round(fps * durationSeconds);

    console.log(`Capturing ${totalFrames} frames at ${fps} fps into ${framesDir}`);

    for(let i=0;i<totalFrames;i++){
        const file = path.join(framesDir, `frame${String(i).padStart(4,'0')}.png`);
        await page.screenshot({path: file});
        // advance time by waiting for the next frame
        await page.waitForTimeout(Math.round(1000 / fps));
        if((i+1) % 10 === 0) process.stdout.write('.');
    }
    console.log('\nCapture complete.');

    await browser.close();

    console.log('Next step: use ffmpeg to combine frames into a GIF. Example:');
    console.log('\nffmpeg -framerate 30 -i frames/frame%04d.png -vf "scale=800:-1:flags=lanczos,fps=30" -loop 0 out.gif\n');
}

run().catch(err=>{ console.error(err); process.exit(1); });
