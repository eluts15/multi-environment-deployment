import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export class ArtifactRegistry extends pulumi.ComponentResource {
    public readonly repository: gcp.artifactregistry.Repository;

    constructor(name: string, projectId: pulumi.Input<string>, opts?: pulumi.ComponentResourceOptions) {
        super("custom:ArtifactRegistry", name, {}, opts);

        this.repository = new gcp.artifactregistry.Repository("foo-images", {
            description: "Docker repository for foo images",
            format: "DOCKER",
            location: "us-central1", // TODO: fetch from config.
            repositoryId: "foo-images",
            project: projectId,
        });

        this.repository = new gcp.artifactregistry.Repository("bar-images", {
            description: "Docker repository for bar images",
            format: "DOCKER",
            location: "us-central1",
            repositoryId: "bar-images",
            project: projectId,
        });

        // If we had more repos to build --we'd add them here.

        this.registerOutputs({
            repositoryId: this.repository.id,
            repositoryName: this.repository.name,
        });
    }
}
