import { Command } from "../parse.ts";
import { getPrettyHeadCommitHash } from "./get-pretty-head-commit-hash.ts";
import { preparePrettierIgnoreFile } from "./prepare-prettier-ignore-file.ts";
import { runPrettier } from "./run-prettier.ts";
import * as configuration from "../configuration.ts";
import * as git from "../tools/git.ts";
import * as logger from "../logger.ts";
import { getProjects, getTargetRepositoryPath } from "../projects.ts";
import { installPrettier } from "./install-prettier.ts";

export interface ExecuteResultEntry {
  commitHash: string;
  diff: string;
}

export async function execute({
  originalPrettier: originalPrettierVersion,
  alternativePrettier: alternativePrettierVersion,
}: Command): Promise<ExecuteResultEntry[]> {
  const projects = await getProjects();
  const commitHashes = await Promise.all(
    projects.map(async (project) =>
      getPrettyHeadCommitHash(getTargetRepositoryPath(project)),
    ),
  );

  // Setup originalVersionPrettier
  await logger.log("Setting up originalVersionPrettier...");
  const originalPrettier = await installPrettier(originalPrettierVersion);
  // Run originalVersionPrettier
  await logger.log("Running originalVersionPrettier...");
  await Promise.all(
    projects.map(async (project) => {
      const targetRepositoryPath = getTargetRepositoryPath(project);
      await preparePrettierIgnoreFile(project);
      await runPrettier(originalPrettier, project);
      await git.add(".", targetRepositoryPath);
      await git.commitAllowEmptyNoVerify(
        "Fixed by originalVersionPrettier",
        targetRepositoryPath,
      );
    }),
  );

  await originalPrettier.dispatch();

  // Setup alternativeVersionPrettier
  await logger.log("Setting up alternativeVersionPrettier...");
  const alternativePrettier = await installPrettier(alternativePrettierVersion);
  // Run alternativeVersionPrettier
  await logger.log("Running alternativeVersionPrettier...");
  await Promise.all(
    projects.map(async (project) => {
      await runPrettier(alternativePrettier, project);
    }),
  );
  await alternativePrettier.dispatch();

  const diffs = await Promise.all(
    projects.map(getTargetRepositoryPath).map(git.diffRepository),
  );

  if (!configuration.isCI) {
    await Promise.all(
      projects.map(async (project) => {
        await git.resetHeadHard(getTargetRepositoryPath(project));
      }),
    );
  }

  return projects.map((_, i) => ({
    commitHash: commitHashes[i],
    diff: diffs[i],
  }));
}
