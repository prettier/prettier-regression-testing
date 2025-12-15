import path from "path";
import { context } from "@actions/github";

const cwd = process.cwd();

console.log(context);

export const IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT = Boolean(
  context.eventName === "issue_comment",
);
export const temporaryDirectory = path.join(cwd, "./running");
export const repositoriesDirectory = path.join(cwd, "./repositories");
export const reportsDirectory = path.join(cwd, "./reports");
export const MAXIMUM_GITHUB_COMMENT_LENGTH = 65536;
export const GITHUB_ACTION_RUN_URL = IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT
  ? `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`
  : undefined;
export const GITHUB_ACTION_JOB_URL = IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT
  ? GITHUB_ACTION_RUN_URL
  : undefined;
