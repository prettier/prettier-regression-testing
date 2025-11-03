import path from "path";
import spawn from "nano-spawn";
import { type Project, getTargetRepositoryPath } from "../projects";
import * as yarn from "../tools/yarn";

export async function runPrettier(
  prettierRepositoryPath: string,
  project: Project,
): Promise<void> {
  const repositoryPath = getTargetRepositoryPath(project);
  const { glob } = project;

  const prettierRepositoryBinPath = path.join(
    prettierRepositoryPath,
    "./bin/prettier.js",
  );

  const args = ["--write", "--no-color"];
  if (Array.isArray(glob)) {
    args.push(...glob.map((pattern) => JSON.stringify(pattern)));
  } else {
    args.push(JSON.stringify(glob));
  }
  try {
    await spawn(prettierRepositoryBinPath, args, {
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
      await spawn(prettierRepositoryBinPath, args, {
        cwd: repositoryPath,
        shell: true,
      });
    } else {
      throw error;
    }
  }
}
