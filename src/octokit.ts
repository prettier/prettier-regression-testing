import * as github from "@actions/github";
import type { GitHub } from "@actions/github/lib/utils";

type Octokit = InstanceType<typeof GitHub>;
let octokit: Octokit | undefined;
export function getOctokit() {
  if (octokit === undefined) {
    const { NODE_AUTH_TOKEN } = process.env;

    if (!NODE_AUTH_TOKEN) {
      throw new Error("`NODE_AUTH_TOKEN` is required.");
    }
    octokit = github.getOctokit(NODE_AUTH_TOKEN);
  }
  return octokit;
}
