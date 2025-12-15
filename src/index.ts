import fs from "fs/promises";
import { inspect } from "node:util";
import * as core from "@actions/core";
import { IS_CI } from "./constants.ts";
import * as logger from "./logger.ts";
import { executeCommand } from "./excute-command.ts";
import { getReport } from "./report.ts";
import { getIssueComment } from "./get-issue-comment.ts";
import { uploadToArtifact } from "./artifact.ts";
import { outdent } from "outdent";

async function exit(error: Error | string) {
  console.error(error);
  if (IS_CI) {
    core.setFailed(error);
  } else {
    process.exit(1);
  }
}

process.on("unhandledRejection", function (reason) {
  let errorText: string;
  // Handle an error thrown by spawn
  /* eslint-disable @typescript-eslint/no-explicit-any */
  if ((reason as any).stderr) {
    errorText =
      "command: " + (reason as any).command + "\n" + (reason as any).stderr;
    /* eslint-enable  @typescript-eslint/no-explicit-any */
  } else {
    errorText = JSON.stringify(reason);
  }
  logger.error(errorText + "\n").then(() => {
    exit(errorText);
  });
});

async function run() {
  let commandString;
  if (IS_CI) {
    const comment = getIssueComment();
    commandString = comment.body as string;
  } else {
    commandString = process.argv.splice(2)[0];
  }

  if (!commandString) {
    throw new Error("Please enter some commands.");
  }

  await logger.log(`Received with command '${commandString}'.`);

  const result = await executeCommand(commandString);

  const { title, reports } = getReport(result);

  const filesToUpload = reports.flatMap((group) =>
    group.results.filter((report) => report.shouldUpload),
  );

  let artifactUrl: string | undefined;

  if (IS_CI && filesToUpload.length > 0) {
    try {
      artifactUrl = await uploadToArtifact(filesToUpload);
    } catch (error) {
      console.log(error);
    }
  }

  for (let index = 0; index < reports.length; index++) {
    const report = reports[index];
    const shouldSeparate = index > 0;
    const text = report.results
      .map((report) => {
        let body = report.diff;
        if (IS_CI && report.shouldUpload) {
          if (artifactUrl) {
            body = `**Visit [this link](${artifactUrl}) to download**`;
          } else {
            body = "💥💥 The diff is to big, and failed to upload. 💥💥";
          }
        }

        return outdent`
            ${report.head}

            ${body}
            `;
      })
      .join("\n\n");

    try {
      await logger.log(
        outdent`
        #### ${title}
        
        ${text}
        `,
        shouldSeparate,
      );
    } catch (error) {
      const isTextTooLongError =
        error instanceof Error &&
        error.message.includes("The text is too long");
      if (isTextTooLongError) {
        console.log(
          `Reports contains ${report.results} repos, lengths: ${JSON.stringify(report.results.map(({ length }) => length))}`,
        );
      }
    }
  }
  process.exit(0);
}

try {
  await run();
} catch (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
) {
  await logger.error(inspect(error));
  await exit(error);
}
