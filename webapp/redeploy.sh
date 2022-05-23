#!/bin/sh
AMS_DIR=~/softwares/ant-media-server
mvn clean install -DskipTests -Dgpg.skip=true
OUT=$?

if [ $OUT -ne 0 ]; then
    exit $OUT
fi

rm $AMS_DIR/ConferenceCallApp.war
cp target/ConferenceCallApp.war $AMS_DIR

OUT=$?

if [ $OUT -ne 0 ]; then
    exit $OUT
fi
