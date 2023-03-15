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

const getTargetRepositoryPath = (targetRepositoryName: string) =>
  path.join(configuration.targetRepositoriesPath, targetRepositoryName);

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
      configuration.cwd
    );
  }
}

export async function execute({
  alternativePrettier,
  originalPrettier,
}: Command): Promise<ExecuteResultEntry[]> {
  const targetRepositoryNames = await fs.readdir(
    configuration.targetRepositoriesPath
  );
  const commitHashes = await Promise.all(
    targetRepositoryNames.map(async (targetRepositoryName) =>
      getPrettyHeadCommitHash(getTargetRepositoryPath(targetRepositoryName))
    )
  );

  await clonePrettier();

  // Setup originalVersionPrettier
  await logger.log("Setting up originalVersionPrettier...");
  await setupPrettierRepository(originalPrettier);
  // Run originalVersionPrettier
  await logger.log("Running originalVersionPrettier...");
  await Promise.all(
    targetRepositoryNames.map(async (targetRepositoryName) => {
      const targetRepositoryPath = getTargetRepositoryPath(
        targetRepositoryName
      );
      await preparePrettierIgnoreFile(
        targetRepositoryPath,
        targetRepositoryName
      );
      await runPrettier(
        configuration.prettierRepositoryPath,
        targetRepositoryPath,
        targetRepositoryName
      );
      await git.add(".", targetRepositoryPath);
      await git.commitAllowEmptyNoVerify(
        "Fixed by originalVersionPrettier",
        targetRepositoryPath
      );
    })
  );

  // Setup alternativeVersionPrettier
  await logger.log("Setting up alternativeVersionPrettier...");
  await setupPrettierRepository(alternativePrettier);
  // Run alternativeVersionPrettier
  await logger.log("Running alternativeVersionPrettier...");
  await Promise.all(
    targetRepositoryNames.map(async (targetRepositoryName) => {
      await runPrettier(
        configuration.prettierRepositoryPath,
        getTargetRepositoryPath(targetRepositoryName),
        targetRepositoryName
      );
    })
  );

  const diffs = await Promise.all(
    targetRepositoryNames.map(getTargetRepositoryPath).map(git.diffRepository)
  );

  if (!configuration.isCI) {
    await Promise.all(
      targetRepositoryNames.map(async (targetRepositoryName) => {
        await git.resetHeadHard(getTargetRepositoryPath(targetRepositoryName));
      })
    );
  }

  return targetRepositoryNames.map((_, i) => ({
    commitHash: commitHashes[i],
    diff: diffs[i],
  }));
}
