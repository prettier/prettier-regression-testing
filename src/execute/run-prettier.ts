import spawn, { type SubprocessError } from "nano-spawn";
import fs from "node:fs/promises";
import { cloneRepository, type Repository } from "../repositories.ts";
import { type InstalledPrettier } from "../install-prettier.ts";
import { preparePrettierIgnoreFile } from "./prepare-prettier-ignore-file.ts";

export async function runPrettierWithVersion({
  directory: cwd,
  prettier,
  repository,
}: {
  directory: string;
  prettier: InstalledPrettier;
  repository: Repository;
}): Promise<void> {
  const args = [prettier.bin, "--write", "--no-color", ...repository.glob];
  const run = () => spawn(process.execPath, args, { cwd });

  try {
    await run();
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any
  ) {
    // if another packages is required to run Prettier
    // e.g. excalidraw: https://github.com/excalidraw/excalidraw/blob/a21db08cae608692d9525fff97f109fb24fec20c/package.json#L83
    if (shouldInstallDependencies(error)) {
      await spawn("yarn", ["install"], {
        cwd,
        env: { YARN_ENABLE_IMMUTABLE_INSTALLS: "false" },
      });
      await run();
    } else {
      throw error;
    }
  }
}

function shouldInstallDependencies(error: SubprocessError) {
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
  repository,
}: {
  directory: string;
  alternative: InstalledPrettier;
  original: InstalledPrettier;
  repository: Repository;
}) {
  await cloneRepository(repository);
  await fs.cp(repository.directory, directory, { recursive: true });

  await preparePrettierIgnoreFile({ directory, repository });
  await commitChanges(directory, "Prepare");

  await runPrettierWithVersion({ directory, prettier: original, repository });
  await commitChanges(directory, "Original");

  await runPrettierWithVersion({
    directory,
    prettier: alternative,
    repository,
  });

  const fileLinkPrefix = `https://github.com/${repository.repository}/tree/${repository.commit}/`;

  const { stdout } = await spawn(
    "git",
    [
      "diff",
      `--src-prefix=Original|${fileLinkPrefix}`,
      `--dst-prefix=Alternative|...`,
    ],
    { cwd: directory },
  );

  return stdout;
}
