import spawn, { type SubprocessError } from "nano-spawn";
import fs from "node:fs/promises";
import { cloneProject, type Project } from "../projects.ts";
import { type InstalledPrettier } from "../install-prettier.ts";
import { preparePrettierIgnoreFile } from "./prepare-prettier-ignore-file.ts";

export async function runPrettierWithVersion({
  directory: cwd,
  prettier,
  project,
}: {
  directory: string;
  prettier: InstalledPrettier;
  project: Project;
}): Promise<void> {
  const args = [prettier.bin, "--write", "--no-color", ...project.glob];
  const run = () => spawn(process.execPath, args, { cwd });

  try {
    await run();
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any
  ) {
    // if another packages is required to run Prettier
    // e.g. excalidraw: https://github.com/excalidraw/excalidraw/blob/a21db08cae608692d9525fff97f109fb24fec20c/package.json#L83
    if (shouldInstall(error)) {
      await spawn("yarn", ["install"], { cwd });
      await run();
    } else {
      throw error;
    }
  }
}

function shouldInstall(error: SubprocessError) {
  const { message, stderr } = error;
  return [message, stderr].some(
    (message) =>
      typeof message === "string" &&
      (message.includes("Cannot find module") ||
        message.includes("Cannot find package")),
  );
}

const commitChanges = async (directory: string, message: string) => {
  await spawn("git", ["add", "."]);
  await spawn(
    "git",
    ["commit", "--allow-empty", "--no-verify", "-m", message],
    { cwd: directory },
  );
};

export async function runPrettier({
  directory,
  alternative,
  original,
  project,
}: {
  directory: string;
  alternative: InstalledPrettier;
  original: InstalledPrettier;
  project: Project;
}) {
  await cloneProject(project);
  await fs.cp(project.directory, directory, { recursive: true });

  await preparePrettierIgnoreFile({ directory, project });
  await commitChanges(directory, "Prepare");

  await runPrettierWithVersion({ directory, prettier: original, project });
  await commitChanges(directory, "Original");

  await runPrettierWithVersion({ directory, prettier: alternative, project });

  const { stdout } = await spawn(
    "git",
    ["diff", `--src-prefix=Original/`, `--dst-prefix=Alternative/`],
    { cwd: directory },
  );

  return stdout;
}
