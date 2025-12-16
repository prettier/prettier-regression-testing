import { IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT } from "./constants.ts";
import * as logger from "./logger.ts";
import { executeCommand } from "./execute-command.ts";
import { getIssueComment } from "./get-issue-comment.ts";
import { writeFile } from "./utilities.ts";
import { reportsDirectory, THROW_EXECUTE_ERROR } from "./constants.ts";
import path from "node:path";
import { reportOnGithubIssue } from "./report-on-github-issue.ts";
import { stringifyReport, getReport } from "./report.ts";

async function run() {
  let commandString;
  if (IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT) {
    const comment = getIssueComment();
    commandString = comment.body as string;
  } else {
    commandString = process.argv.splice(2)[0];
  }

  if (!commandString) {
    throw new Error("Please enter some commands.");
  }

  await logger.brief(
    `Received with command \`${commandString}\`, start execute ...`,
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
