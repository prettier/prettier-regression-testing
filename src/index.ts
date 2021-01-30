import github from "@actions/github";
import * as configuration from "./configuration";
import * as logger from "./logger";
import { execute } from "./execute";
import { getLogText } from "./log-text";
import { parse } from "./parse";

(async () => {
  let commandString;
  if (configuration.isCI) {
    commandString = github.context.payload.comment!.body as string;
  } else {
    commandString = process.argv.splice(2)[0];
  }
  try {
    const command = parse(commandString);
    const result = await execute(command);
    const logText = getLogText(result, command);
    await logger.log(logText);
  } catch (error) {
    await logger.log("## [Error]\n\n" + error.message);
  }
})();
