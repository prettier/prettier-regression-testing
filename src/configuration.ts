import path from "path";

export const cwd = process.cwd();
export const prettierRepositoryPath = path.join(cwd, "./prettier");
export const targetRepositoriesPath = path.join(cwd, "./repos");
