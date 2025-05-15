check_for_changes() {
    # Check for any changes (staged, unstaged, or untracked files)
    if [[ -n $(git status --porcelain) ]]; then
        echo "You have uncommitted changes. Please stash or commit your changes before continuing."
        exit 1
    fi
}

echo "Checking for changes in the current branch..."
check_for_changes
echo "building circle for talentis"

if [ "$(basename "$PWD")" != "scripts" ]; then
  cd ./scripts || { echo "Failed to change directory to ./scripts"; exit 1; }
fi

cp -r ./build_replace/* ../

cd ..

### original createwar.sh below (cupy upstream updates below) ###
# cd react
# npm install
# npm run build
# cd ..
# rm webapp/src/main/webapp/static/css/*
# rm webapp/src/main/webapp/static/js/*
# cp -a react/build/. webapp/src/main/webapp


# cd webapp
# mvn clean install -DskipTests -Dgpg.skip=true --quiet
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
