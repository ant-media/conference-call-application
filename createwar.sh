cd react
npm install
npm run build
cd ..
cp -a react/build/. webapp/src/main/webapp
cd webapp
mvn clean install -DskipTests -Dgpg.skip=true --quiet
