import fs from "fs/promises";
import github from "@actions/github";
import * as configuration from "./configuration";
import type { GitHub } from "@actions/github/lib/utils";

type Octokit = InstanceType<typeof GitHub>;
let octokit: Octokit | undefined;
function getOctokit(): Octokit {
  if (octokit === undefined) {
    octokit = github.getOctokit(configuration.authToken);
  }
  return octokit;
}

let commentId: number | undefined;
async function logToIssueComment(logText: string) {
  const octokit = getOctokit();
  if (commentId === undefined) {
    const comment = await octokit.issues.createComment({
      ...github.context.repo,
      issue_number: github.context.issue.number,
      body: logText,
    });
    commentId = comment.data.id;
  } else {
    await octokit.issues.updateComment({
      ...github.context.repo,
      comment_id: commentId,
      body: logText,
    });
  }
}

export async function log(logText: string): Promise<void> {
  if (configuration.isCI) {
    console.log(logText);
    await logToIssueComment(logText);
  } else {
    const fileData = await fs.readFile("log.txt", "utf-8");
    await fs.writeFile("log.txt", fileData + logText + "\n");
  }
}

export async function error(logText: string): Promise<void> {
  if (configuration.isCI) {
    const errorText = "## [Error]\n\n" + "```\n" + logText + "```";
    console.log(errorText);
    await logToIssueComment(errorText);
  } else {
    await fs.writeFile("log.txt", "[Error]\n\n" + logText);
  }
}
