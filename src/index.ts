import fs from "fs/promises";
import * as configuration from "./configuration";
import * as logger from "./logger";
import { execute } from "./execute";
import { getLogText } from "./log-text";
import { parse } from "./parse";
import { getIssueComment } from "./get-issue-comment";

process.on("unhandledRejection", function (reason) {
  let errorText;
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
    process.exit(1);
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
    const command = parse(commandString);
    const result = await execute(command);
    const logText = getLogText(result, command);
    await logger.log(logText);
    process.exit(0);
  } catch (error) {
    await logger.error(error);
    process.exit(1);
  }
})();
