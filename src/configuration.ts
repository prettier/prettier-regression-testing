import path from "path";
import ci from "ci-info";

export const cwd = process.cwd();
export const prettierRepositoryPath = path.join(cwd, "./prettier");
export const targetRepositoriesPath = path.join(cwd, "./repos");
export const isCI = ci.isCI;
