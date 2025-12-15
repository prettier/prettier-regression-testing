import path from "path";

const cwd = process.cwd();

export const IS_CI = Boolean(process.env.CI);
export const temporaryDirectory = path.join(cwd, "./running");
export const repositoriesDirectory = path.join(cwd, "./repositories");
export const reportsDirectory = path.join(cwd, "./reports");
export const MAXIMUM_GITHUB_COMMENT_LENGTH = 65536;
