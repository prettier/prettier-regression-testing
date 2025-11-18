import path from "path";
import spawn from "nano-spawn";
import { type Project, getTargetRepositoryPath } from "../projects";
import * as yarn from "../tools/yarn";

export async function runPrettier(
  prettierRepositoryPath: string,
  project: Project,
): Promise<void> {
  const repositoryPath = getTargetRepositoryPath(project);
  const glob = project ?? ['.']

  const prettierRepositoryBinPath = path.join(
    prettierRepositoryPath,
    "./bin/prettier.js",
  );

  const args = [
    prettierRepositoryBinPath,
    "--write",
    "--no-color",
    ...(Array.isArray(glob) ? glob : [glob]),
  ];
  try {
    await spawn(process.execPath, args, {
      cwd: repositoryPath,
    });
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any
  ) {
    // if another packages is required to run Prettier
    // e.g. excalidraw: https://github.com/excalidraw/excalidraw/blob/a21db08cae608692d9525fff97f109fb24fec20c/package.json#L83
    if (error.message.includes("Cannot find module")) {
      await yarn.install(repositoryPath);
      await spawn(process.execPath, args, {
        cwd: repositoryPath,
      });
    } else {
      throw error;
    }
  }
}
