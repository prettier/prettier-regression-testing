import spawn from "nano-spawn";
import path from "node:path";
import assert from "node:assert/strict";
import { repositoriesDirectory } from "./constants.ts";
import { clearDirectory } from "./utilities.ts";
import rawRepositories from "../repositories.json" with { type: "json" };

type RawRepository = {
  repository: string;
  glob: string | readonly string[];
  ignoreFile?: string;
  ignore?: string | readonly string[];
  commit: string;
};
export type Repository = {
  repository: string;
  glob: readonly string[];
  ignoreFile?: string | undefined;
  ignore: readonly string[];
  commit: string;
  directoryName: string;
  directory: string;
};

let repositories: Repository[];
export function getRepositories(): Repository[] {
  if (repositories) {
    return repositories;
  }

  assert.ok(Array.isArray(rawRepositories) && rawRepositories.length > 0);

  const result: Repository[] = [];

  for (const _rawRepository of rawRepositories) {
    const rawRepository = _rawRepository as RawRepository;

    assert.equal(typeof rawRepository.repository, "string");
    assert.ok(
      /^[\w-]+\/[\w-]+$/.test(rawRepository.repository),
      `Invalid repository '${rawRepository.repository}'`,
    );
    assert.equal(typeof rawRepository.commit, "string");

    const glob = Array.isArray(rawRepository.glob)
      ? rawRepository.glob
      : [rawRepository.glob ?? "."];
    const ignore = Array.isArray(rawRepository.ignore)
      ? rawRepository.ignore
      : rawRepository.ignore
        ? [rawRepository.ignore]
        : [];
    const directoryName = rawRepository.repository.replaceAll("/", "__");

    result.push({
      repository: rawRepository.repository,
      commit: rawRepository.commit,
      glob,
      ignore,
      directoryName,
      directory: path.join(repositoriesDirectory, directoryName),
    });
  }

  repositories = result;

  return result;
}

async function getCommitHash({ short, cwd }: { short?: boolean; cwd: string }) {
  try {
    const { stdout } = await spawn(
      "git",
      ["rev-parse", ...(short ? ["--short"] : []), "HEAD"],
      { cwd },
    );
    return stdout.trim();
  } catch {
    // No op
  }
}

export async function cloneRepository(repository: Repository) {
  const cwd = repository.directory;

  // If it's already on the correct commit
  if ((await getCommitHash({ cwd })) === repository.commit) {
    return;
  }

  await clearDirectory(cwd);
  await spawn("git", ["init"], { cwd });
  await spawn(
    "git",
    [
      "fetch",
      "--depth=1",
      `https://github.com/${repository.repository}`,
      repository.commit,
    ],
    { cwd },
  );
  await spawn("git", ["checkout", repository.commit], { cwd });

  assert.equal(await getCommitHash({ cwd }), repository.commit);

  return;
}
