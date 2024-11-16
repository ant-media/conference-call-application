const { execSync } = require('child_process');

const bucketName = 'lyst-lib/learnyst-live-player/ant-media-circle-app-test/build';
const buildFolder = 'build';

try {
  // Sync build folder to S3 bucket
  execSync(`aws s3 sync ${buildFolder} s3://${bucketName}  --delete --acl public-read`, { stdio: 'inherit' });
  console.log('Build files successfully and uploaded to S3.');
} catch (error) {
  console.error('Error uploading build files to S3:', error.message);
  process.exit(1);
}