#!/bin/bash

PROFILE="dev"
PROJECT_ID="YOUR_PROJECT_NAME"
DEPLOYMENT_BUCKET_NAME="gs://pulumi-statefiles-deployments-30107ec0"
AUTH_PATH="~/.config/gcloud/application_default_credentials.json.personal"

gcloud config configurations list
gcloud config configurations activate $PROFILE
gcloud config configurations list
gcloud auth application-default login --client-id-file=$AUTH_PATH
gcloud auth application-default set-quota-project $YOUR_PROJECT_NAME

pulumi login $DEPLOYMENT_BUCKET_NAME
