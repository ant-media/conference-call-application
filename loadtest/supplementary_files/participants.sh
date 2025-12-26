#!/bin/bash

ROOM=$1
COUNT=$2

./run.sh -m publisher -s meet.antmedia.io -p 443 -q true -f test.mp4  -a Conference -i part -t $ROOM -n $COUNT &
sleep 5
./run.sh -s meet.antmedia.io -p 443 -q true -a Conference -i $ROOM -t $ROOM -u false -n $COUNT