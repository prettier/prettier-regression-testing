import { existsSync } from "fs";
import { Command } from "../parse.ts";
import { getPrettyHeadCommitHash } from "./get-pretty-head-commit-hash.ts";
import { preparePrettierIgnoreFile } from "./prepare-prettier-ignore-file.ts";
import { runPrettier } from "./run-prettier.ts";
import { setupPrettierRepository } from "./setup-repository.ts";
import * as configuration from "../configuration.ts";
import * as git from "../tools/git.ts";
import * as logger from "../logger.ts";
import { getProjects, getTargetRepositoryPath } from "../projects.ts";

export interface ExecuteResultEntry {
  commitHash: string;
  diff: string;
}

async function clonePrettier() {
  if (!existsSync(configuration.prettierRepositoryPath)) {
    await logger.log("Cloning Prettier repository...");
    await git.clone(
      "https://github.com/prettier/prettier.git",
      "./prettier",
      configuration.cwd,
    );
  }
}

export async function execute({
  alternativePrettier,
  originalPrettier,
}: Command): Promise<ExecuteResultEntry[]> {
  const projects = await getProjects();
  const commitHashes = await Promise.all(
    projects.map(async (project) =>
      getPrettyHeadCommitHash(getTargetRepositoryPath(project)),
    ),
  );

  await clonePrettier();

  // Setup originalVersionPrettier
  await logger.log("Setting up originalVersionPrettier...");
  await setupPrettierRepository(originalPrettier);
  // Run originalVersionPrettier
  await logger.log("Running originalVersionPrettier...");
  await Promise.all(
    projects.map(async (project) => {
      const targetRepositoryPath = getTargetRepositoryPath(project);
      await preparePrettierIgnoreFile(project);
      await runPrettier(configuration.prettierRepositoryPath, project);
      await git.add(".", targetRepositoryPath);
      await git.commitAllowEmptyNoVerify(
        "Fixed by originalVersionPrettier",
        targetRepositoryPath,
      );
    }),
  );

  // Setup alternativeVersionPrettier
  await logger.log("Setting up alternativeVersionPrettier...");
  await setupPrettierRepository(alternativePrettier);
  // Run alternativeVersionPrettier
  await logger.log("Running alternativeVersionPrettier...");
  await Promise.all(
    projects.map(async (project) => {
      await runPrettier(configuration.prettierRepositoryPath, project);
    }),
  );

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
