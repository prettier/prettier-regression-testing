import fs from "fs/promises";
import path from "path";
import { Command } from "../parse";
import { getPrettyHeadCommitHash } from "./get-pretty-head-commit-hash";
import { runPrettier } from "./run-prettier";
import { setupPrettierRepository } from "./setup-repository";
import * as configuration from "../configuration";
import * as git from "../tools/git";
import * as logger from "../logger";

const getTargetRepositoryPath = (targetRepositoryName: string) =>
  path.join(configuration.targetRepositoriesPath, targetRepositoryName);

export interface ExecuteResult {
  targetRepositoriesPrettyheadCommitHashList: string[];
  diffString: string;
}
export async function execute({
  alternativePrettier,
  originalPrettier,
}: Command): Promise<ExecuteResult> {
  const targetRepositoryNames = await fs.readdir(
    configuration.targetRepositoriesPath
  );
  const targetRepositoriesPrettyheadCommitHashList = await Promise.all(
    targetRepositoryNames.map(async (targetRepositoryName) =>
      getPrettyHeadCommitHash(getTargetRepositoryPath(targetRepositoryName))
    )
  );

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

  const diffString = (
    await Promise.all(
      targetRepositoryNames.map(getTargetRepositoryPath).map(git.diffRepository)
    )
  ).join("\n");

  if (!configuration.isCI) {
    await Promise.all(
      targetRepositoryNames.map(async (targetRepositoryName) => {
        await git.resetHeadHard(getTargetRepositoryPath(targetRepositoryName));
      })
    );
  }

  return {
    diffString,
    targetRepositoriesPrettyheadCommitHashList,
  };
}
