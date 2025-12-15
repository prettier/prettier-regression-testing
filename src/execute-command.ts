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

  await logger.brief(
    `Running Prettier on ${repositories.length} repositories ...`,
  );

  let finished = 0;
  const results = await Promise.allSettled(
    repositories.map(async (repository) => {
      try {
        return await runPrettier(repository, {
          cwd: directory,
          alternative: alternativePrettier,
          original: originalPrettier,
        });
      } finally {
        finished++;
        logger.brief(
          `${finished}/${repositories.length} repositories finished ...`,
        );
      }
    }),
  );

  const failedJobsCount = results.filter(
    (result) => result.status === "rejected",
  ).length;
  await logger.brief(
    `Job finished, succeed on ${results.length - failedJobsCount} repositories, fail on ${failedJobsCount} repositories.\n\nPreparing reports ...`,
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
            `error-${repository.directoryName}.txt`,
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

        const diff = result.value;
        const file = path.join(
          reportsDirectory,
          `${diff ? "diff" : "empty"}-${repository.directoryName}-success.diff`,
        );
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
