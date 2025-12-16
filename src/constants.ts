import { context } from "@actions/github";
import path from "path";
import packageJson from "../package.json" with { type: "json" };

const PROJECT_ROOT = path.join(import.meta.dirname, "../");
const IS_CI = Boolean(process.env.CI);
// Create files outside the project to avoid slowing down the editor
const WORKING_DIRECTORY = IS_CI
  ? PROJECT_ROOT
  : path.join(PROJECT_ROOT, `../${packageJson.name}-working-directory/`);

console.log(context);

export const IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT = Boolean(
  context.eventName === "issue_comment",
);
export const temporaryDirectory = path.join(WORKING_DIRECTORY, "./running/");
export const repositoriesDirectory = path.join(
  WORKING_DIRECTORY,
  "./repositories/",
);
export const reportsDirectory = path.join(PROJECT_ROOT, "./reports/");
export const MAXIMUM_GITHUB_COMMENT_LENGTH = 65536;
export const GITHUB_ACTION_RUN_URL = IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT
  ? `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`
  : undefined;
export const GITHUB_ACTION_JOB_URL = IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT
  ? GITHUB_ACTION_RUN_URL
  : undefined;
export const THROW_EXECUTE_ERROR =
  IS_CI && !IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT;
