import fs from "fs/promises";
import path from "path";
import { Command } from "../parse";
import { getPrettyHeadCommitHash } from "./get-pretty-head-commit-hash";
import { runPrettier } from "./run-prettier";
import { setupPrettierRepository } from "./setup-repository";
import * as configuration from "../configuration";

const getTargetRepositoryPath = (targetRepositoryName: string) =>
  path.join(configuration.targetRepositoriesPath, targetRepositoryName);

export async function execute({
  alternativePrettier,
  originalPrettier,
}: Command) {
  const targetRepositoryNames = await fs.readdir(
    configuration.targetRepositoriesPath
  );
  const prettierHeadCommitHashList = await Promise.all(
    targetRepositoryNames.map(async (targetRepositoryName) =>
      getPrettyHeadCommitHash(getTargetRepositoryPath(targetRepositoryName))
    )
  );

  await setupPrettierRepository(originalPrettier);
  await Promise.all(
    targetRepositoryNames.map(async (targetRepositoryName) => {
      await runPrettier(
        configuration.prettierRepositoryPath,
        getTargetRepositoryPath(targetRepositoryName),
        targetRepositoryName
      );
    })
  );
}
