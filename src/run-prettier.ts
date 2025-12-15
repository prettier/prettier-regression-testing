import path from "node:path";
import spawn, { type SubprocessError } from "nano-spawn";
import { type Repository } from "./repositories.ts";
import { type InstalledPrettier } from "./install-prettier.ts";
import { prepareRepository } from "./prepare-repository.ts";
import { commitChanges } from "./utilities.ts";
import { Timing } from "./timing.ts";
import fs from "node:fs/promises";

async function runPrettierWithVersion({
  cwd,
  prettier,
  repository,
  reset,
}: {
  cwd: string;
  prettier: InstalledPrettier;
  repository: Repository;
  reset: () => Promise<void>;
}) {
  const timing = new Timing(
    `Run Prettier(${prettier.version.kind}) on repository '${repository.repository}'`,
  );
  await reset();

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
      await fs.rm(path.join(cwd, "yarn.lock"), { force: true });
      await spawn("git", ["reset", "--hard"], { cwd });
      await run();
    } else {
      throw error;
    }
  }

  const commitHash = await commitChanges(cwd, prettier.version.kind);

  await spawn("git", ["branch", prettier.version.kind], { cwd });

  timing.end();
  return commitHash;
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

export async function runPrettier(
  repository: Repository,
  {
    cwd,
    alternative,
    original,
  }: {
    cwd: string;
    alternative: InstalledPrettier;
    original: InstalledPrettier;
  },
) {
  const timing = new Timing(
    `Run Prettier on repository '${repository.repository}'`,
  );
  const directory = path.join(cwd, `repositories/${repository.directoryName}`);

  const { reset } = await prepareRepository(directory, repository);

  await runPrettierWithVersion({
    cwd: directory,
    prettier: original,
    repository,
    reset,
  });

  await runPrettierWithVersion({
    cwd: directory,
    prettier: alternative,
    repository,
    reset,
  });

  const fileLinkPrefix = `https://github.com/${repository.repository}/tree/${repository.commit}/`;

  const { stdout: diff } = await spawn(
    "git",
    [
      "diff",
      alternative.version.kind,
      original.version.kind,
      `--src-prefix=Original|${fileLinkPrefix}`,
      `--dst-prefix=Alternative|`,
    ],
    { cwd: directory },
  );

  if (diff) {
    console.log(diff);
  }

  timing.end();
  return diff;
}
