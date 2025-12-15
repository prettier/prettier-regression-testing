import { runPrettier } from "./run-prettier.ts";
import * as logger from "./logger.ts";
import { installPrettier } from "./install-prettier.ts";
import { parseCommand } from "./parse-command.ts";
import { createTemporaryDirectory, writeFile } from "./utilities.ts";
import { reportsDirectory } from "./constants.ts";
import path from "node:path";

export async function executeCommand(commandString: string) {
  const { alternative, original, repositories } = parseCommand(commandString);
  const directory = await createTemporaryDirectory();

  // Install Prettier
  await logger.log("Installing Prettier...");
  const [alternativePrettier, originalPrettier] = await Promise.all(
    [original, alternative].map((version) =>
      installPrettier(version, { cwd: directory }),
    ),
  );

  const result = await Promise.all(
    repositories.map(async (repository, index) => {
      await logger.log(
        `[${index + 1}/${repositories.length}] Running Prettier on '${repository.repository}' ...`,
      );

      const diff = await runPrettier(repository, {
        cwd: directory,
        alternative: alternativePrettier,
        original: originalPrettier,
      });

      await writeFile(
        path.join(reportsDirectory, `${repository.directoryName}.diff`),
        diff,
      );

      return {
        repository,
        diff,
      };
    }),
  );

  return {
    alternative,
    original,
    result,
  };
}
