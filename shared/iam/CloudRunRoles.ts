import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export class CloudRunRoles extends pulumi.ComponentResource {
    public readonly serviceAccount: gcp.serviceaccount.Account;

    constructor(name: string, projectId: pulumi.Input<string>, opts?: pulumi.ComponentResourceOptions) {
        super("custom:CloudRunRoles", name, {}, opts);

        // Create a Cloud Run service account
        this.serviceAccount = new gcp.serviceaccount.Account(`${name}-service-account`, {
            accountId: "cloudrun-svc-acc", // 30 character is the max
            displayName: "CloudRun Service Account to deploy `foo`",
            project: projectId,
        }, { parent: this });

        new gcp.projects.IAMMember(`${name}-logging`, {
            member: this.serviceAccount.email.apply(email => `serviceAccount:${email}`),
            role: "roles/logging.logWriter",
            project: projectId,
        }, { parent: this,
				dependsOn: this.serviceAccount
		});

        new gcp.projects.IAMMember(`${name}-artifact-registry-reader`, {
            member: this.serviceAccount.email.apply(email => `serviceAccount:${email}`),
            role: "roles/artifactregistry.reader",
            project: projectId,
        }, { parent: this,
			    dependsOn: this.serviceAccount
		});

        // Grant Cloudrun instances the ability to fetch secrets from secret manager within this project.
        new gcp.projects.IAMMember(`${name}-secret-manager-accessor`, {
            member: this.serviceAccount.email.apply(email => `serviceAccount:${email}`),
            role: "roles/secretmanager.secretAccessor",
            project: projectId,
        }, { 
            parent: this,
            dependsOn: this.serviceAccount
        });

        this.registerOutputs({
            serviceAccountEmail: this.serviceAccount.email,
            serviceAccountId: this.serviceAccount.id,
        });
    }
}