cd react
npm install --legacy-peer-deps
npm run build
cd ..
rm webapp/src/main/webapp/static/css/*
rm webapp/src/main/webapp/static/js/*
cp -a react/build/. webapp/src/main/webapp


cd webapp
mvn clean install -DskipTests -Dgpg.skip=true --quiet
