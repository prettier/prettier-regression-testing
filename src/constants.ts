import path from "path";
import * as github from "@actions/github";

const cwd = process.cwd();

export const IS_GITHUB_ACTION = Boolean(github.context.runId);
export const temporaryDirectory = path.join(cwd, "./running");
export const repositoriesDirectory = path.join(cwd, "./repositories");
export const reportsDirectory = path.join(cwd, "./reports");
export const MAXIMUM_GITHUB_COMMENT_LENGTH = 65536;
export const GITHUB_ACTION_RUN_URL = IS_GITHUB_ACTION
  ? `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/actions/runs/${github.context.runId}/`
  : undefined;
