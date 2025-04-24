
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

import { SecretManager } from "./services/SecretManager";
import { ArtifactRegistry } from "./services/ArtifactRegistry";
import { CloudBuildRoles } from "./iam/CloudBuildRoles";
import { CloudRunRoles } from "./iam/CloudRunRoles";
import { Cloudbuild } from "./services/Cloudbuild";
import { repos } from "./repo-config";

const gcpConfig = new pulumi.Config("gcp");
const projectId = gcpConfig.require("project");
const billingProject = gcpConfig.require("billingProject");
console.log("Using projectId: ", projectId);
console.log("Using billingProject: ", billingProject);

/* Our GCP Provider
If this was more than an example, we'd pass these more securely;
For this for demonstration it's fine.
*/
new gcp.Provider("gcp", {
    project: projectId,
    billingProject: billingProject,
    userProjectOverride: true
});

// Enable the Google APIs we require.
function enableServices(projectId: string, services: string[]) {
    return services.map(service => 
        new gcp.projects.Service(`${service}`, {
            project: projectId,
            service: service,
            disableOnDestroy: true,
        })
    );
}

const requiredApis = [
    "cloudbuild.googleapis.com",            // Cloud Build API
    "artifactregistry.googleapis.com",      // Artifact Registry API
    "iam.googleapis.com",                   // IAM API
    "run.googleapis.com",                   // Cloud Run API
    "secretmanager.googleapis.com",         // Secret Manager API
   // "container.googleapis.com",           // Google Kubernetes Enging API
   // "cloudresourcemanager.googleapis.com",  // Resource Manager API
    // Add other APIs here as necessary.

];

const enabledApis = enableServices(projectId, requiredApis);

// TODO: Might need some small `wait` period here to ensure that the APIs are enabled before continuing.

// Shared Secret Resources -- secrets that are shared between environments
new SecretManager(`shared-secrets`, {
    projectId: projectId,
    envFilePath: "./.env.shared",
}, {
    dependsOn: enabledApis
});

// Set up our artifact registry to store Docker images that are built when our various ci/cd pipelines complete successfully.
const artifactRegistry = new ArtifactRegistry("artifact-registry", projectId, {
    dependsOn: enabledApis
});

// Setup roles/permissions for the GCP services that we want to use.
 const cloudBuildRoles = new CloudBuildRoles("cloudbuild-permission-set", projectId, {
     dependsOn: enabledApis
 });

 const cloudRunRoles = new CloudRunRoles("cloudrun-permissions-set", projectId, {
     dependsOn: enabledApis
 });

 const cloudbuild = new Cloudbuild("cloudbuild-resources", {
     projectId: projectId,
     cloudbuildServiceAccountId: cloudBuildRoles.serviceAccount.id,
     cloudbuildServiceAccountEmail: cloudBuildRoles.serviceAccount.email,
 });


/*
Create our cloudbuild triggers.
Cloudbuild works pretty well for building CI/CD pipelines.
We keep the CI/CD `steps` themseleves in the repos we're building;
the steps might vary depending on the requirements of the service we're building.
*/

// builds from the the app repo and deploys when commits pushed to the develop branch.
const appDevTrigger = cloudbuild.appBuildDevTrigger(repos[1]);

// builds from a "deployments" repo that consists of submodules (our "app" in this case).
// when we `push` to the `main` branch, updating the submodule reference; we trigger a deployment to QA.
const deploymentQATrigger = cloudbuild.deploymentsQATrigger(repos[0]);

// when we `push` a new tag that meets our regex requirements, we are trigging a deployment to prod.
const deploymentProdTrigger = cloudbuild.deploymentsProdTrigger(repos[0]);


/*
Outputs
These print useful information when we run `pulumi preview/up` locally.
*/
// service-accounts
export const cloudbuildServiceAccountEmail = cloudBuildRoles.serviceAccount.email;
export const cloudbuildServiceAccountId = cloudBuildRoles.serviceAccount.id;
export const cloudrunServiceAccountEmail = cloudRunRoles.serviceAccount.email;
export const cloudrunServiceAccountId = cloudRunRoles.serviceAccount.id;

// registry for images
export const artifactRegistryRepositoryId = artifactRegistry.repository.id;
export const artifactRegistryRepositoryName = artifactRegistry.repository.name;

// cloudbuild triggers 
export const appDevTriggerId = appDevTrigger.id;
//export const deploymentQATriggerId = deploymentQATrigger.id;
//export const deploymentProdTriggerId = deploymentProdTrigger.id;
