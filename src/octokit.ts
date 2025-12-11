import { getOctokit as githubGetOctokit } from "@actions/github";

type Octokit = ReturnType<typeof githubGetOctokit>;
let octokit: Octokit | undefined;
export function getOctokit() {
  if (octokit === undefined) {
    const { NODE_AUTH_TOKEN } = process.env;

    if (!NODE_AUTH_TOKEN) {
      throw new Error("`NODE_AUTH_TOKEN` is required.");
    }
    octokit = githubGetOctokit(NODE_AUTH_TOKEN);
  }
  return octokit;
}
