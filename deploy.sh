#!/bin/bash

export USER_NAME="${USER_NAME}"
export PASSWORD="${PASSWORD}"
export KUBE_CONFIG_DATA="${KUBE_CONFIG_DATA}"

# Set SERVER_URL based on the branch name
if [[ "$BRANCH_NAME" == "main" ]]; then
  SERVER_URL="https://meet.antmedia.io"
  K8S_NAMESPACE="antmedia"
else
  SERVER_URL="https://circle.antmedia.io"
  K8S_NAMESPACE="circle"
fi

# Get versions data from repo
wget -O maven-metadata.xml https://oss.sonatype.org/service/local/repositories/snapshots/content/io/antmedia/ant-media-server/maven-metadata.xml       

# Install jq
sudo apt-get install jq -y

# Download war File
LATEST_SNAPSHOT=$(cat maven-metadata.xml | grep "<version>" | tail -n 1 | xargs | cut -c 10-23)
echo "Latest snapshot version: $LATEST_SNAPSHOT"
wget -O ConferenceCall.war "https://oss.sonatype.org/service/local/artifact/maven/redirect?r=snapshots&g=io.antmedia.webrtc&a=ConferenceCall&v=${LATEST_SNAPSHOT}&e=war"
ls -al

# Login to server
curl -X POST -H "Accept: Application/json" -H "Content-Type: application/json" "${SERVER_URL}/rest/v2/users/authenticate" -d '{"email":"'"${USER_NAME}"'","password":"'"${PASSWORD}"'"}' -c cookie.txt 

# Delete Old App
curl -i -X DELETE -H "Accept: Application/json" -H "Content-Type: application/json" "${SERVER_URL}/rest/v2/applications/Conference" -b cookie.txt
sleep 10

# Create New App
WAR_FILE_NAME="ConferenceCall.war"
curl -X PUT -H "Accept: Application/json" -H "Content-Type: multipart/form-data" -F "file=@./$WAR_FILE_NAME" "${SERVER_URL}/rest/v2/applications/Conference" -b cookie.txt

# Check if Conference app exists
response=$(curl -s "${SERVER_URL}/rest/v2/applications" -b cookie.txt)
if [[ $(echo "$response" | jq '. | any(. == "Conference")' | grep -c true) -eq 0 ]]; then
  app_exists=false
else
  app_exists=true
fi

# Setup kubectl
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl jq
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
echo "${KUBE_CONFIG_DATA}" | base64 --decode > kubeconfig
export KUBECONFIG=kubeconfig

# Delete pod if the conference app not exists
if [[ "$app_exists" == false ]]; then
  POD_NAME=$(kubectl get pods -l app=ant-media-origin -n $K8S_NAMESPACE -o jsonpath='{.items[0].metadata.name}')
  kubectl delete pod $POD_NAME -n circle
  sleep 20

  # Login to server again
  curl -X POST -H "Accept: Application/json" -H "Content-Type: application/json" "${SERVER_URL}/rest/v2/users/authenticate" -d '{"email":"'"${USER_NAME}"'","password":"'"${PASSWORD}"'"}' -c cookie.txt 

  # Recreate Conference App
  curl -X PUT -H "Accept: Application/json" -H "Content-Type: multipart/form-data" -F "file=@./$WAR_FILE_NAME" "${SERVER_URL}/rest/v2/applications/Conference" -b cookie.txt
fi
