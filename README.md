## Overview

This is a example project that demonstrates `infrastructure-as-code` concepts; specifically, with Pulumi.  
This particular example demonstrates how one could manage multiple environments in the cloud (in this case GCP) leveraging a  
`two-step` deployment method. 

## What It Does

There are four stacks in total that represent environments: `shared`, `dev`, `qa`, `prod`.  
The `shared` stack is composed of resources that are created once and leveraged across the various environments.
These include resources such as:  

- IAM: Necessary service accounts and permissions.  
- CI/CD: pipelines provisioned in GCP with CloudBuild.  
- SecretManager: Shared and environment specific secrets generated and stored in GCP SecretsManager.  


## Getting things up and running  
Note: this requires a personal GCP account and could cost a few dollars.

1. Create the shared resources stack.  

```
cd shared  && ./init.sh
```

2. Create resources in the cloud.  

```
cd shared
pulumi up
```


3. Create the stacks for `dev`, `qa`, `prod`.  

```
cd environments && ./init.sh
```

4. Create resources in the cloud for each environment.  

```
pulumi stack select dev
pulumi up
```

```
pulumi-statefiles-deployments-30107ec0
```
