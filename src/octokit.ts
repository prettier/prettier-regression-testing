import * as github from "@actions/github";
import * as configuration from "./configuration";
import type { GitHub } from "@actions/github/lib/utils";

type Octokit = InstanceType<typeof GitHub>;
let octokit: Octokit | undefined;
export function getOctokit() {
  if (octokit === undefined) {
    octokit = github.getOctokit(configuration.authToken);
  }
  return octokit;
}
