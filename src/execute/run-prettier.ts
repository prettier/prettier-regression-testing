import execa from "execa";
import path from "path";
import { projects } from "../projects";

export async function runPrettier(
  prettierRepositoryPath: string,
  repositoryPath: string,
  repositoryName: string
): Promise<void> {
  const project = projects[repositoryName];
  if (!project) {
    throw new Error(`Repository name '${repositoryName}' is invalid`);
  }
  const { ignore, glob } = project;

  const prettierRepositoryBinPath = path.join(
    prettierRepositoryPath,
    "./bin/prettier.js"
  );

  const args = ["--write"];
  args.push(JSON.stringify(glob));
  if (ignore) {
    args.push("--ignore-path", ignore);
  }
  await execa(prettierRepositoryBinPath, args, {
    cwd: repositoryPath,
    shell: true,
  });
}
