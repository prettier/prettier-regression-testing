import spawn from "nano-spawn";
import { type Project, getTargetRepositoryPath } from "../projects.ts";
import * as yarn from "../tools/yarn.ts";
import { type InstalledPrettier } from "./install-prettier.ts";

export async function runPrettier(
  prettier: InstalledPrettier,
  project: Project,
): Promise<void> {
  const repositoryPath = getTargetRepositoryPath(project);
  const glob = project.glob ?? ["."];

  const args = [
    prettier.bin,
    "--write",
    "--no-color",
    ...(Array.isArray(glob) ? glob : [glob]),
  ];
  const run = () => spawn(process.execPath, args, { cwd: repositoryPath });

  try {
    await run();
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any
  ) {
    // if another packages is required to run Prettier
    // e.g. excalidraw: https://github.com/excalidraw/excalidraw/blob/a21db08cae608692d9525fff97f109fb24fec20c/package.json#L83
    if (error.message.includes("Cannot find module")) {
      await yarn.install(repositoryPath);
      await run();
    } else {
      throw error;
    }
  }
}
