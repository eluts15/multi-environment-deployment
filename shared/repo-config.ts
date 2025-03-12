export interface RepoConfig {
    owner: string;
    name: string;
    buildPath: string;
    branchName?: string;
}

// New repos that need to be built can be added here.
export const repos: RepoConfig[] = [
    {
        owner: "eluts15",
        name: "deployments",
        buildPath: "cloudbuild.yaml", // default
        branchName: "main"
    },
    {
        owner: "eluts15",
        name: "my-app",
        buildPath: "cloudbuild.yaml",
        branchName: "^(develop|experimental/.+)$"
    },
];
