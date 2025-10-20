import { existsSync, promises as fs } from "fs";
import path from "path";
import { Command } from "../parse";
import { getPrettyHeadCommitHash } from "./get-pretty-head-commit-hash";
import { preparePrettierIgnoreFile } from "./prepare-prettier-ignore-file";
import { runPrettier } from "./run-prettier";
import { setupPrettierRepository } from "./setup-repository";
import * as configuration from "../configuration";
import * as git from "../tools/git";
import * as logger from "../logger";
import {
  getProjects,
  getProjectName,
  type Project,
  getTargetRepositoryPath,
} from "../projects";

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
      const targetRepositoryName = getProjectName(project);
      const targetRepositoryPath = getTargetRepositoryPath(project);
      await preparePrettierIgnoreFile(project);
      await runPrettier(
        configuration.prettierRepositoryPath,
        targetRepositoryPath,
        targetRepositoryName,
      );
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
      await runPrettier(
        configuration.prettierRepositoryPath,
        getTargetRepositoryPath(project),
        getProjectName(project),
      );
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
