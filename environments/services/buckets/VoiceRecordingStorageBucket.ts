import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

export interface  VoiceRecordingStorageBucketArgs {
    region: string;
    project: string;
    serviceAccountEmail: pulumi.Input<string>;
}

export class VoiceRecordingStorageBucket extends pulumi.ComponentResource {
    public readonly bucket: gcp.storage.Bucket;
    public readonly bucketName: pulumi.Output<string>;

    constructor(name: string, args: VoiceRecordingStorageBucketArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:resource:VoiceRecordingStorageBucket", name, args, opts);

        // Create the storage bucket
        this.bucket = new gcp.storage.Bucket(`${name}`, {
            location: args.region,
            uniformBucketLevelAccess: true,
            forceDestroy: true,
        }, { parent: this });


        // Create the IAM binding for the bucket
        // If this was more than a demonstration, we'd be more strict on policies.
        new gcp.storage.BucketIAMBinding(`${name}-bucket-iam-admin`, {
            bucket: this.bucket.name,
            role: "roles/storage.admin",
            members: [
                pulumi.interpolate`serviceAccount:${args.serviceAccountEmail}`,
            ],
        }, { parent: this });


        this.bucketName = this.bucket.name;

        this.registerOutputs({
            bucket: this.bucket,
            bucketName: this.bucketName,
        });
    }
}

