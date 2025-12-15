import path from "path";
import { context } from "@actions/github";

const cwd = process.cwd();

console.log(context);

export const IS_GITHUB_ACTION = Boolean(context.runId);
export const temporaryDirectory = path.join(cwd, "./running");
export const repositoriesDirectory = path.join(cwd, "./repositories");
export const reportsDirectory = path.join(cwd, "./reports");
export const MAXIMUM_GITHUB_COMMENT_LENGTH = 65536;
export const GITHUB_ACTION_RUN_URL = IS_GITHUB_ACTION
  ? `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`
  : undefined;
export const GITHUB_ACTION_JOB_URL = IS_GITHUB_ACTION
  ? GITHUB_ACTION_RUN_URL
  : undefined;
