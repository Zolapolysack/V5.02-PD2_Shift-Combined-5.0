const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

(async function(){
  try{
    const root = path.resolve(__dirname, '..');
    const src = path.join(root, 'images.png');
    const outDir = path.join(root, 'assets', 'images');
    if (!fs.existsSync(src)) throw new Error('Source images.png not found at ' + src);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const img = await Jimp.read(src);
    await img.clone().cover(192,192).writeAsync(path.join(outDir, 'icon-192.png'));
    await img.clone().cover(512,512).writeAsync(path.join(outDir, 'icon-512.png'));
    console.log('Wrote icon-192.png and icon-512.png to', outDir);
  }catch(err){
    console.error('make-icons failed:', err);
    process.exitCode = 1;
  }
})();
