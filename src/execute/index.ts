import fs from "fs/promises";
import path from "path";
import { Command } from "../parse";
import { getPrettyHeadCommitHash } from "./get-pretty-head-commit-hash";
import { runPrettier } from "./run-prettier";
import { setupPrettierRepository } from "./setup-repository";
import * as configuration from "../configuration";
import * as git from "../tools/git";

const getTargetRepositoryPath = (targetRepositoryName: string) =>
  path.join(configuration.targetRepositoriesPath, targetRepositoryName);

export async function execute({
  alternativePrettier,
  originalPrettier,
}: Command): Promise<{
  targetRepositoriesPrettyheadCommitHashList: string[];
  diffString: string;
}> {
  const targetRepositoryNames = await fs.readdir(
    configuration.targetRepositoriesPath
  );
  const targetRepositoriesPrettyheadCommitHashList = await Promise.all(
    targetRepositoryNames.map(async (targetRepositoryName) =>
      getPrettyHeadCommitHash(getTargetRepositoryPath(targetRepositoryName))
    )
  );

  // Setup originalVersionPrettier
  await setupPrettierRepository(originalPrettier);
  // Run originalVersionPrettier
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
      await git.commit(
        "Fixed by originalVersionPrettier",
        targetRepositoryPath
      );
    })
  );

  // Setup alternativeVersionPrettier
  await setupPrettierRepository(alternativePrettier);
  // Run alternativeVersionPrettier
  await Promise.all(
    targetRepositoryNames.map(async (targetRepositoryName) => {
      await runPrettier(
        configuration.prettierRepositoryPath,
        getTargetRepositoryPath(targetRepositoryName),
        targetRepositoryName
      );
    })
  );

  const diffString = await git.diffSubmodule(
    configuration.targetRepositoriesPath,
    configuration.cwd
  );
  await Promise.all(
    targetRepositoryNames.map(async (targetRepositoryName) => {
      await git.resetHeadHard(getTargetRepositoryPath(targetRepositoryName));
    })
  );

  return {
    diffString,
    targetRepositoriesPrettyheadCommitHashList,
  };
}
