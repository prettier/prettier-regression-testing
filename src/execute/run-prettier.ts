import path from "path";
import execa from "execa";
import { getProjects } from "../projects";
import * as yarn from "../tools/yarn";

export async function runPrettier(
  prettierRepositoryPath: string,
  repositoryPath: string,
  repositoryName: string,
): Promise<void> {
  const projects = await getProjects();
  const project = projects[repositoryName];
  if (!project) {
    throw new Error(`Repository name '${repositoryName}' is invalid`);
  }
  const { glob } = project;

  const prettierRepositoryBinPath = path.join(
    prettierRepositoryPath,
    "./bin/prettier.js",
  );

  const args = ["--write"];
  if (Array.isArray(glob)) {
    args.push(...glob.map((pattern) => JSON.stringify(pattern)));
  } else {
    args.push(JSON.stringify(glob));
  }
  try {
    await execa(prettierRepositoryBinPath, args, {
      cwd: repositoryPath,
      shell: true,
    });
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any
  ) {
    // if another packages is required to run Prettier
    // e.g. excalidraw: https://github.com/excalidraw/excalidraw/blob/a21db08cae608692d9525fff97f109fb24fec20c/package.json#L83
    if (error.message.includes("Cannot find module")) {
      await yarn.install(repositoryPath);
      await execa(prettierRepositoryBinPath, args, {
        cwd: repositoryPath,
        shell: true,
      });
    } else {
      throw error;
    }
  }
}
