import { IS_GITHUB_ACTION } from "./constants.ts";
import * as logger from "./logger.ts";
import { executeCommand } from "./execute-command.ts";
import { getIssueComment } from "./get-issue-comment.ts";
import { writeFile } from "./utilities.ts";
import { reportsDirectory } from "./constants.ts";
import path from "node:path";
import { reportOnGithubIssue } from "./report-on-github-issue.ts";
import { stringifyReport, getReport } from "./report.ts";

async function run() {
  let commandString;
  if (IS_GITHUB_ACTION) {
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

  const report = getReport(commandExecuteResult);

  await writeFile(
    path.join(reportsDirectory, "report.md"),
    stringifyReport(report),
  );

  await reportOnGithubIssue(report);
}

try {
  await run();
} catch (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
) {
  await logger.error(error);
}
