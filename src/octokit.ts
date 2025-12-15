import { getOctokit as githubGetOctokit } from "@actions/github";

type Octokit = ReturnType<typeof githubGetOctokit>;
let octokit: Octokit | undefined;
export function getOctokit() {
  if (octokit === undefined) {
    const { GITHUB_TOKEN } = process.env;

    if (!GITHUB_TOKEN) {
      throw new Error("`GITHUB_TOKEN` is required.");
    }

    octokit = githubGetOctokit(GITHUB_TOKEN);
  }
  return octokit;
}
