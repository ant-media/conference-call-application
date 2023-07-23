cd react
#just move the .env file to .env.bak to not have any problems with the build
mv .env .env.bak
npm install
npm run build
#restore the .env file
mv .env.bak .env 
cd ..
rm webapp/src/main/webapp/static/css/*
rm webapp/src/main/webapp/static/js/*
cp -a react/build/. webapp/src/main/webapp