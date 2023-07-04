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

const TOO_LONG_DIFF_THRESHOLD_IN_CHARACTERS = 60000;

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
  // Handle an error thrown by execa
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
    const logText = getLogText(result, command);
    if (typeof logText === "string") {
      await logger.log(logText);
    } else {
      const largeTexts: string[] = [];
      for (let index = 0; index < logText.length; index++) {
        const text = logText[index];
        const shouldSeparate = index > 0;
        if (
          text.length >= TOO_LONG_DIFF_THRESHOLD_IN_CHARACTERS &&
          configuration.isCI
        ) {
          largeTexts.push(text);
        } else {
          await logger.log(logText[index], shouldSeparate);
        }
      }
      const artifactUrl = await uploadToArtifact(largeTexts);
      if (artifactUrl) {
        await logger.log(
          "Uploaded too large log.\n" +
            `You can download it from ${artifactUrl} .`,
        );
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
