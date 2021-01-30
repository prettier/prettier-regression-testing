import fs from "fs/promises";
import github from "@actions/github";
import * as configuration from "./configuration";

export async function log(logText: string) {
  if (configuration.isCI) {
    const comment = github.context.payload.comment!;
    const octokit = github.getOctokit(configuration.authToken);
    await octokit.issues.updateComment({
      ...github.context.repo,
      comment_id: comment.id,
      body: logText,
    });
  } else {
    await fs.writeFile("log.txt", logText);
    console.log(logText);
  }
}

export async function error(logText: string) {
  if (configuration.isCI) {
    const comment = github.context.payload.comment!;
    const octokit = github.getOctokit(configuration.authToken);
    await octokit.issues.updateComment({
      ...github.context.repo,
      comment_id: comment.id,
      body: "## [Error]\n\n" + logText,
    });
  } else {
    const _logText = "[Error]\n\n" + logText;
    await fs.writeFile("log.txt", _logText);
    console.error(_logText);
  }
}
