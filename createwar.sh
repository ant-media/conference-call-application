cd react
npm install
npm run build

# Whenever webpack modify volume-meter-processor.js, it adds some require statement at the beginning of the file and it breaks worklet.
# To prevent this behaviour, we just replace file with the version come from node_modules

volume_meter_unminified_js_path=$"./node_modules/@antmedia/webrtc_adaptor/dist/volume-meter-processor.js"
volume_meter_js_path="$(find "./build/static/media" -name "volume-meter-processor*js" -type f -print -quit)"

if [ -z "$volume_meter_js_path=" ]
then
      echo "\$volume_meter_js_path is empty passing.."
else
      rm $volume_meter_js_path
      cp $volume_meter_unminified_js_path $volume_meter_js_path
fi

cd ..
rm webapp/src/main/webapp/static/css/*
rm webapp/src/main/webapp/static/js/*
cp -a react/build/. webapp/src/main/webapp
cd webapp
mvn clean install -DskipTests -Dgpg.skip=true --quiet
