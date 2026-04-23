console.log("Running custom build script...");

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const buildDir = process.env.BUILD_PATH ? process.env.BUILD_PATH : './build';
const volumeMeterUnminifiedJsPath = './node_modules/@antmedia/webrtc_adaptor/dist/volume-meter-processor.js';
const pattern = path.join(buildDir, 'static/media/volume-meter-processor*.js');
const matches = glob.sync(pattern, { nodir: true });
const volumeMeterJsPath = matches && matches.length > 0 ? matches[0] : null;

if (!volumeMeterJsPath) {
  console.log('$volumeMeterJsPath is empty. Skipping...');
} else {
  try {
    fs.unlinkSync(volumeMeterJsPath);
  } catch (e) {
    console.log('Could not unlink existing volume-meter-processor file, will overwrite:', e.message);
  }
  fs.copyFileSync(volumeMeterUnminifiedJsPath, volumeMeterJsPath);
}

console.log("Custom build script completed successfully.");
