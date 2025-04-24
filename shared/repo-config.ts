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
        name: "components",
        buildPath: "cloudbuild.yaml", // default
        branchName: "main"
    },
    {
        owner: "eluts15",
        name: "foo",
        buildPath: "cloudbuild.yaml",
        branchName: "^(develop|experimental/.+)$"
    },
    {
        owner: "eluts15",
        name: "bar",
        buildPath: "cloudbuild.yaml",
        branchName: "^(develop|experimental/.+)$"
    },
];
