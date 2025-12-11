import { runPrettier } from "./run-prettier.ts";
import * as logger from "../logger.ts";
import { installPrettiers } from "../install-prettier.ts";
import { getProjects } from "../projects.ts";
import { parseCommand } from "../parse-command.ts";
import { createTemporaryDirectory } from "../directory.ts";
import path from "node:path";

export async function execute(commandString: string) {
  const { alternative, original } = parseCommand(commandString);
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

  const projects = await getProjects();
  for (const [index, project] of projects.entries()) {
    await logger.log(
      `[${index + 1} / ${projects.length}] Running Prettier on ${project.repository} ...`,
    );

    const diff = await runPrettier({
      directory: path.join(directory, `tests/${project.directoryName}`),
      alternative: alternativePrettier,
      original: originalPrettier,
      project,
    });

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
