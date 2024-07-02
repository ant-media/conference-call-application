# cleanup
current_branch=$(git symbolic-ref --short HEAD)
git reset --hard HEAD
git checkout "$current_branch"
git clean -fd