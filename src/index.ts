import path from "node:path";
import * as github from "@actions/github";
import { IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT } from "./constants.ts";
import { reportsDirectory, THROW_EXECUTE_ERROR } from "./constants.ts";
import { executeCommand } from "./execute-command.ts";
import * as logger from "./logger.ts";
import { getReport, stringifyReport } from "./report.ts";
import { reportOnGithubIssue } from "./report-on-github-issue.ts";
import { writeFile } from "./utilities.ts";

async function run() {
  let commandString;
  if (IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT) {
    const { comment } = github.context.payload;
    if (!comment) {
      throw new Error("'github.context.payload.comment' is missing.");
    }
    commandString = comment.body;
  } else {
    commandString = process.argv.splice(2)[0];
  }

  if (typeof commandString !== "string" || !commandString) {
    throw new Error("Missing required command string.");
  }

  await logger.brief(
    `Received command \`${commandString}\`, start execute ...`,
  );

  const commandExecuteResult = await executeCommand(commandString);
  const errors = commandExecuteResult.results
    .filter((result) => result.fail)
    .map(({ error }) => error);

  const report = getReport(commandExecuteResult);

  await writeFile(
    path.join(reportsDirectory, "report.md"),
    stringifyReport(report),
  );

  await reportOnGithubIssue(report);

  if (THROW_EXECUTE_ERROR && errors.length) {
    throw new AggregateError(errors, "Command exclude failure.");
  }
}

try {
  await run();
} catch (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
) {
  if (THROW_EXECUTE_ERROR) {
    throw error;
  }

  await logger.error(error);
}
