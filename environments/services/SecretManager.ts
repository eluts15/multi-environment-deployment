import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as fs from "fs";
import * as dotenv from "dotenv";

export class SecretManager extends pulumi.ComponentResource {
    public readonly secrets: { [key: string]: gcp.secretmanager.Secret };

    constructor(
        name: string,
        args: {
            environment: string,
            projectId: pulumi.Input<string>,
            envFilePath: string,
        },
        opts?: pulumi.ComponentResourceOptions
    ) {
        super("environments:SecretManager", name, {}, opts);

        const envVars = this.loadEnvFile(args.envFilePath);
        this.secrets = {};

        for (const [key, value] of Object.entries(envVars)) {
            const secretName = this.formatSecretName(`dummy-${key}-${args.environment}`);
            this.secrets[key] = this.createSecret(secretName, args.projectId, value);
        }

        this.registerOutputs({
            secrets: this.secrets,
        });
    }

    private loadEnvFile(filePath: string): { [key: string]: string } {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Env file not found: ${filePath}`);
        }
        return dotenv.parse(fs.readFileSync(filePath));
    }

    private formatSecretName(name: string): string {
        // Replace underscores with hyphens and convert to lowercase
        return name.replace(/_/g, '-').toLowerCase();
    }

    private createSecret(
        name: string,
        projectId: pulumi.Input<string>,
        secretValue: string,
    ): gcp.secretmanager.Secret {
        const secret = new gcp.secretmanager.Secret(name, {
            secretId: name,
            replication: {
                userManaged: {
                    replicas: [{ location: "us-central1" }],
                },
            },
            project: projectId,
        }, { parent: this, deleteBeforeReplace: true });

        new gcp.secretmanager.SecretVersion(`${name}-version`, {
            secret: secret.id,
            secretData: secretValue,
        }, { parent: this, deleteBeforeReplace: true });

        return secret;
    }
}