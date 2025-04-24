import * as pulumi from "@pulumi/pulumi";
import { SecretManager } from "./services/SecretManager";
import { VoiceRecordingStorageBucket } from "./services/buckets/VoiceRecordingStorageBucket";

const environmentConfig = new pulumi.Config("global");
const environment = environmentConfig.require("environment");

const gcpConfig = new pulumi.Config("gcp");
const projectId = gcpConfig.require("project");
const region = gcpConfig.require("region");

// Reference resources from the `shared` stack.
// Use getOutput instead of requireOutput and provide default values.
const sharedStack = new pulumi.StackReference("organization/shared");



// Instance for managing Secrets at the environment-level.
// Any secrets added to `.env` files will be created in Secret Manager when `pulumi up` is run.
const secretsManager = new SecretManager(`dummy-secrets-${environment}`, {
    environment: environment,
    projectId: projectId,
    envFilePath: `./.env.${environment}`,
});

new VoiceRecordingStorageBucket(`voice-recordings-${environment}`, {
    region: region,
    project: projectId,
    serviceAccountEmail: sharedStack.getOutput("cloudbuildServiceAccountEmail")
}, { retainOnDelete: true });

