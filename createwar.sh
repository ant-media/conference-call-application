sh ./preparebundle.sh
cd webapp
mvn clean install -DskipTests -Dgpg.skip=true --quiet
