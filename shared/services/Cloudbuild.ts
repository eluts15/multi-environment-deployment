import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { RepoConfig } from "../repo-config";

export interface BuilderArgs {
    projectId: string;
    cloudbuildServiceAccountId?: pulumi.Input<string>;
    cloudbuildServiceAccountEmail?: pulumi.Input<string>;
}

export class Cloudbuild extends pulumi.ComponentResource {
    public readonly cloudbuildServiceAccountId: pulumi.Output<string>;
    public readonly cloudbuildServiceAccountEmail: pulumi.Output<string>;
    private projectId: string;

    constructor(
        name: string,
        args: BuilderArgs,
        opts?: pulumi.ComponentResourceOptions
    ) {
        super("custom:resource:Cloudbuild", name, args, opts);

        this.projectId = args.projectId;

        if (args.cloudbuildServiceAccountId && args.cloudbuildServiceAccountEmail) {
            this.cloudbuildServiceAccountId = pulumi.output(args.cloudbuildServiceAccountId);
            this.cloudbuildServiceAccountEmail = pulumi.output(args.cloudbuildServiceAccountEmail);
        } else {
					console.log("CloudBuild Service Account does not exist.")
				}

        this.registerOutputs({
            cloudbuildServiceAccountId: this.cloudbuildServiceAccountId,
            cloudbuildServiceAccountEmail: this.cloudbuildServiceAccountEmail,
        });
    }

    /*
    DEV BUILD TRIGGERS
    App Builds
    A deployment to dev happens when a branch is merged and pushed to a branch that matches our specified regex.
    */
    appBuildDevTrigger(repo: RepoConfig) {
        return new gcp.cloudbuild.Trigger(`${repo.name}-builder-dev`, {
            description: "Builds and deploys the app when new commits are pushed to branch: develop.",
            name: `${repo.name}-dev`,
            project: this.projectId,
            filename: repo.buildPath,
            github: {
                owner: repo.owner,
                name: repo.name,
                push: {
                    branch: repo.branchName
                },
            },
            substitutions: {
                _ENVIRONMENT: "dev",

            },
            serviceAccount: this.cloudbuildServiceAccountId,
        }, { parent: this, replaceOnChanges: ["*"] });
    }

    /* 
    QA BUILD TRIGGERS
    A deployment to QA happens when a merge is pushed to branch `main`.
    */
    deploymentsQATrigger(repo: RepoConfig) {
        return new gcp.cloudbuild.Trigger(`${repo.name}-qa`, {
            description: `Deploys from our monorepo: ${repo.name} to QA from push event on main branch.`, 
            name: `${repo.name}-qa`,
            project: this.projectId,
            filename: "qa.yaml", // here, I'm overriding the default cloudbuild.yaml
            github: {
                owner: repo.owner,
                name: repo.name,
                push: {
                    branch: repo.branchName, 
                },
            },
            substitutions: {
                _ENVIRONMENT: "qa"
            },
            serviceAccount: this.cloudbuildServiceAccountId,
        }, { parent: this });
    }

    /*
    PROD BUILD TRIGGERS
    A deployment to prod only happens when we push a new tag on main matching our specified release pattern.
    */
    deploymentsProdTrigger(repo: RepoConfig) {
        return new gcp.cloudbuild.Trigger(`${repo.name}-prod`, {
            description: `Deploys from our monorepo: ${repo.name} to prod from a tagged event only.`, 
            name: `${repo.name}-prod`,
            project: this.projectId,
            filename: "prod.yaml",
            github: {
                owner: repo.owner,
                name: repo.name,
                push: {
                    tag:"release-v*.*.*", // Only deploy to prod if we push a tag that matches this format.
                },
            },
            substitutions: {
                _ENVIRONMENT: "prod"
            },
            serviceAccount: this.cloudbuildServiceAccountId,
        }, { parent: this, replaceOnChanges: ["*"], deleteBeforeReplace: true });
    }

}

