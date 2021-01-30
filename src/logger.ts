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
    const fileData = await fs.readFile("log.txt", "utf-8");
    await fs.writeFile("log.txt", fileData + logText + "\n");
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
    await fs.writeFile("log.txt", "[Error]\n\n" + logText);
  }
}
