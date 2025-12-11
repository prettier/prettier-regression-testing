import { runPrettier } from "./run-prettier.ts";
import * as logger from "../logger.ts";
import { installPrettiers } from "../install-prettier.ts";
import { parseCommand } from "../parse-command.ts";
import { createTemporaryDirectory } from "../directory.ts";
import path from "node:path";
import fs from "node:fs/promises";

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

  for (const [index, project] of repositories.entries()) {
    await logger.log(
      `[${index + 1}/${repositories.length}] Running Prettier on '${project.name}' ...`,
    );

    const diff = await runPrettier({
      directory: path.join(directory, `tests/${project.directoryName}`),
      alternative: alternativePrettier,
      original: originalPrettier,
      project,
    });

    await fs.writeFile(
      path.join(`reports/${project.directoryName}.diff`),
      diff,
    );

    result.push({
      project,
      diff,
    });
  }

  return {
    alternative,
    original,
    result,
  };
}
