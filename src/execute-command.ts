import { inspect } from "node:util";
import { runPrettier } from "./run-prettier.ts";
import * as logger from "./logger.ts";
import { installPrettier } from "./install-prettier.ts";
import { parseCommand } from "./parse-command.ts";
import { createTemporaryDirectory } from "./utilities.ts";
import { writeFile } from "./utilities.ts";
import { reportsDirectory } from "./constants.ts";
import path from "node:path";

export type ExecuteCommandResult = Awaited<ReturnType<typeof executeCommand>>;

export async function executeCommand(commandString: string) {
  const { alternative, original, repositories } = parseCommand(commandString);
  const directory = await createTemporaryDirectory();

  // Install Prettier
  const [alternativePrettier, originalPrettier] = await Promise.all(
    [original, alternative].map((version) =>
      installPrettier(version, { cwd: directory }),
    ),
  );

  await logger.log(
    `Running Prettier on ${repositories.length} repositories ...`,
  );

  const results = await Promise.allSettled(
    repositories.map((repository) =>
      runPrettier(repository, {
        cwd: directory,
        alternative: alternativePrettier,
        original: originalPrettier,
      }),
    ),
  );

  return {
    alternative,
    original,
    results: await Promise.all(
      results.map(async (result, index) => {
        const repository = repositories[index];
        if (result.status === "rejected") {
          const error = result.reason;
          const file = path.join(
            reportsDirectory,
            `${repository.repository}-error.txt`,
          );
          const stringifiedError = inspect(error);
          await writeFile(file, stringifiedError);
          return {
            repository,
            fail: true as const,
            error,
            stringifiedError: stringifiedError,
          };
        }

        const file = path.join(
          reportsDirectory,
          `${repository.repository}-success.diff`,
        );
        const diff = result.value;
        await writeFile(file, diff);
        return {
          repository,
          fail: false as const,
          diff,
        };
      }),
    ),
  };
}
