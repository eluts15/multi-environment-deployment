import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export class CloudBuildRoles extends pulumi.ComponentResource {
    public readonly serviceAccount: gcp.serviceaccount.Account;

    constructor(name: string, projectId: pulumi.Input<string>, opts?: pulumi.ComponentResourceOptions) {
        super("custom:CloudBuildRoles", name, {}, opts);

        // Create a Cloud Build service account
        this.serviceAccount = new gcp.serviceaccount.Account(`${name}-service-account`, {
            accountId: "cloudbuild-svc-acc", // 30 character is the max
            displayName: "cloudbuild-svc-acc",
            project: projectId,
        }, { parent: this });

        new gcp.projects.IAMMember(`${name}-logging`, {
            member: this.serviceAccount.email.apply(email => `serviceAccount:${email}`),
            role: "roles/logging.logWriter",
            project: projectId,
        }, {
            parent: this,
            dependsOn: this.serviceAccount
        });

        // Allow cloudbuild to push new built images to our artifact registry
        new gcp.projects.IAMMember(`${name}-artifact-registry-writer`, {
            member: this.serviceAccount.email.apply(email => `serviceAccount:${email}`),
            role: "roles/artifactregistry.writer",
            project: projectId,
        }, {
            parent: this,
            deleteBeforeReplace: true,
            dependsOn: this.serviceAccount
        });


        // TODO: Fix permissions -- too open.
        new gcp.projects.IAMMember(`${name}-secret-manager-admin`, {
            member: this.serviceAccount.email.apply(email => `serviceAccount:${email}`),
            role: "roles/secretmanager.admin",
            project: projectId,
        }, {
            parent: this,
            deleteBeforeReplace: true,
            dependsOn: this.serviceAccount
        });

        // TODO: Fix permissions -- too open.
        // Allow CloudBuild to trigger CloudRun deployments.
        new gcp.projects.IAMMember(`${name}-cloudrun-deploy-svc`, {
            member: this.serviceAccount.email.apply(email => `serviceAccount:${email}`),
            role: "roles/run.admin",
            project: projectId,
        }, {
            parent: this,
            deleteBeforeReplace: true,
            dependsOn: this.serviceAccount
        });

        // Grant the Cloudbuild resources the ability to fetch images from artifact registry.
        //new gcp.projects.IAMMember(`${name}-artifact-registry-reader`, {
        //    member: this.serviceAccount.email.apply(email => `serviceAccount:${email}`),
        //    role: "roles/artifactregistry.reader",
        //    project: projectId,
        //}, {
        //    parent: this,
        //    deleteBeforeReplace: true,
        //    dependsOn: this.serviceAccount
        //});

        /* Alternatively. grant Cloudbuild resources ability to fetch images from a `specific` registry instead.
        In this case, a repository named `foo`
        */
        new gcp.artifactregistry.RepositoryIamMember(`${name}-artifact-reader`, {
            location: "us-central1",
            repository: "app-images",
            role: "roles/artifactregistry.reader",
            member: this.serviceAccount.email.apply(email => `serviceAccount:${email}`),
            project: projectId
        });
            
        // Grant Service Account User role to the Cloud Build service account
        const cloudbuildServiceAccountUser = new gcp.projects.IAMMember("cloudbuild-service-account-user", {
            project: projectId,
            role: "roles/iam.serviceAccountUser",
            member: pulumi.interpolate`serviceAccount:${this.serviceAccount.email}`,
        });


        this.registerOutputs({
            serviceAccountEmail: this.serviceAccount.email,
            serviceAccountId: this.serviceAccount.id,
        });
    }
}