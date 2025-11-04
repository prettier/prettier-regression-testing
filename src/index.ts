import fs from "fs/promises";
import * as core from "@actions/core";
import * as configuration from "./configuration";
import * as logger from "./logger";
import { execute } from "./execute";
import { getLogText } from "./log-text";
import { parse } from "./parse";
import { getIssueComment } from "./get-issue-comment";
import { cloneProjects } from "./projects";
import { uploadToArtifact } from "./artifact";
import { outdent } from "outdent";

async function exit(error: Error | string) {
  if (configuration.isCI) {
    core.setFailed(error);
  } else {
    console.error(error);
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

(async () => {
  try {
    let commandString;
    if (configuration.isCI) {
      const comment = getIssueComment();
      commandString = comment.body as string;
    } else {
      await fs.writeFile("log.txt", "");
      commandString = process.argv.splice(2)[0];
    }
    if (!commandString) {
      throw new Error("Please enter some commands.");
    }
    await cloneProjects();
    const command = parse(commandString);
    const result = await execute(command);
    const { title, reports } = getLogText(result, command);
    const filesToUpload = reports
      .flatMap((group) => group.results.filter((report) => report.shouldUpload))
      .map((report) => report.diff);
    const { isCI } = configuration;

    let artifactUrl: string | undefined;

    if (isCI && filesToUpload.length > 0) {
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
          if (isCI) {
            if (artifactUrl) {
              body = `**Visit [this link](${artifactUrl}) to download**`;
            } else {
              body = "!!The diff is to big, and failed to upload.!!";
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
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any
  ) {
    await logger.error(error);
    process.exit(1);
  }
})().catch((error) => {
  logger.error(JSON.stringify(error)).then(() => {
    exit(error);
  });
});
