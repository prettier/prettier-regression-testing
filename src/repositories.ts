import spawn from "nano-spawn";
import path from "node:path";
import assert from "node:assert/strict";
import { repositoriesDirectory } from "./constants.ts";
import { clearDirectory, getCommitHash } from "./utilities.ts";
import rawRepositories from "../repositories.json" with { type: "json" };
import { Timing } from "./timing.ts";

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

export async function cloneRepository(repository: Repository) {
  const { directory, commit: commitHash } = repository;

  // If it's already on the correct commit
  try {
    if ((await getCommitHash(directory)) === commitHash) {
      return;
    }
  } catch {
    // No op
  }

  const timing = new Timing(`Cloning repository '${repository.repository}'`);

  await clearDirectory(directory);
  await spawn("git", ["init"], { cwd: directory });
  await spawn(
    "git",
    [
      "fetch",
      "--depth=1",
      `https://github.com/${repository.repository}`,
      commitHash,
    ],
    { cwd: directory },
  );
  await spawn("git", ["switch", "-c", commitHash, commitHash], {
    cwd: directory,
  });

  assert.equal(await getCommitHash(directory), commitHash);

  timing.end();
}
