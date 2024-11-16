#!/bin/sh
AMS_DIR=~/softwares/ant-media-server
mvn clean install -DskipTests -Dgpg.skip=true
OUT=$?

if [ $OUT -ne 0 ]; then
    exit $OUT
fi

rm -r $AMS_DIR/webapps/ConferenceCall
cp target/ConferenceCall.war $AMS_DIR/webapps

OUT=$?

if [ $OUT -ne 0 ]; then
    exit $OUT
fi
