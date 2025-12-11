import { runPrettier } from "./run-prettier.ts";
import * as logger from "../logger.ts";
import { installPrettiers } from "../install-prettier.ts";
import { parseCommand } from "../parse-command.ts";
import { createTemporaryDirectory, writeFile } from "../utilities.ts";
import path from "node:path";

export async function execute(commandString: string) {
  const { alternative, original, repositories } = parseCommand(commandString);
  const directory = await createTemporaryDirectory();

  // Install Prettier
  await logger.log("Installing Prettier...");
  const { alternative: alternativePrettier, original: originalPrettier } =
    await installPrettiers({
      directory,
      alternative,
      original,
    });

  const result = [];

  for (const [index, repository] of repositories.entries()) {
    await logger.log(
      `[${index + 1}/${repositories.length}] Running Prettier on '${repository.repository}' ...`,
    );

    const diff = await runPrettier({
      directory: path.join(directory, `tests/${repository.directoryName}`),
      alternative: alternativePrettier,
      original: originalPrettier,
      repository,
    });

    await writeFile(
      path.join(directory, `reports/${repository.directoryName}.diff`),
      diff,
    );

    result.push({
      repository,
      diff,
    });
  }

  return {
    alternative,
    original,
    result,
  };
}
