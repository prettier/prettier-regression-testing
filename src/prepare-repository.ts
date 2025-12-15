import path from "node:path";
import {
  writeFile,
  readFile,
  unique,
  commitChanges,
  resetToCommitHash,
} from "./utilities.ts";
import fs from "node:fs/promises";
import { cloneRepository, type Repository } from "./repositories.ts";
import spawn from "nano-spawn";

async function preparePrettierIgnoreFile(
  directory: string,
  repository: Repository,
) {
  if (!repository.ignoreFile && repository.ignore.length === 0) {
    return;
  }

  const files = unique(
    [".prettierignore", repository.ignoreFile].filter(Boolean),
  );

  const contents = await Promise.all(
    files.map((file) => readFile(path.join(directory, file!))),
  );

  const content = [...contents, ...repository.ignore].join("\n");

  const prettierIgnoreFile = path.join(directory, ".prettierignore");
  await writeFile(prettierIgnoreFile, content);
}

export async function prepareRepository(
  directory: string,
  repository: Repository,
) {
  await cloneRepository(repository);
  await fs.cp(repository.directory, directory, { recursive: true });
  await fs.rm(path.join(directory, ".git"), { recursive: true, force: true });
  await preparePrettierIgnoreFile(directory, repository);
  await spawn("git", ["init"], { cwd: directory });

  const commitHash = await commitChanges(directory, "Initialize", true);

  return {
    async reset() {
      await resetToCommitHash(directory, commitHash);
    },
  };
}
