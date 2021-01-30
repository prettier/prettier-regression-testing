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
    console.error("[Error]\n\n" + logText);
  }
}
