const github = require("@actions/github");
import * as configuration from "./configuration";
import { execute } from "./execute";
import { getLogText } from "./log-text";
import { parse } from "./parse";

(async () => {
  if (configuration.isCI) {
    const commandString = github.context.payload.comment.body;
    const command = parse(commandString);
    const result = await execute(command);
    const logText = getLogText(result, command);
  } else {
    // CLI
    console.log("Not implemented.");
  }
})();
