console.log("Running custom build script...");

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const volumeMeterUnminifiedJsPath = './node_modules/@antmedia/webrtc_adaptor/dist/volume-meter-processor.js';
const volumeMeterJsPath = glob.sync('./build/static/media/volume-meter-processor*.js', { nodir: true })[0];

if (!volumeMeterJsPath) {
  console.log('$volumeMeterJsPath is empty. Skipping...');
} else {
  fs.unlinkSync(volumeMeterJsPath);
  fs.copyFileSync(volumeMeterUnminifiedJsPath, volumeMeterJsPath);
}

console.log("Custom build script completed successfully.");
