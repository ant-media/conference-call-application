cd react
npm install --legacy-peer-deps
npm run build
cd ..
if [ -d "webapp/src/main/webapp/static" ] && [ "$(ls -A webapp/src/main/webapp/static)" ]; then
    echo "Directory webapp/src/main/webapp/static/ exists and has files. Removing files..."
    rm -rf webapp/src/main/webapp/static/*
    echo "All files in webapp/src/main/webapp/static/ have been removed."
else
    echo "Directory webapp/src/main/webapp/static/ is either empty or does not exist. No files to remove."
fi
cp -a react/build/. webapp/src/main/webapp


cd webapp
mvn clean install -DskipTests -Dgpg.skip=true --quiet
