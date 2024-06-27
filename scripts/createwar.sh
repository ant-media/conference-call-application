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
cd react
npm install
npm run build
cd ..
rm webapp/src/main/webapp/static/css/*
rm webapp/src/main/webapp/static/js/*
cp -a react/build/. webapp/src/main/webapp


cd webapp
mvn clean install -DskipTests -Dgpg.skip=true --quiet
