import fs from "fs/promises";
import * as github from "@actions/github";
import * as configuration from "./configuration";
import { getOctokit } from "./octokit";

let commentId: number | undefined;
async function logToIssueComment(logText: string, separateComment = false) {
  if (logText.length > configuration.MAXIMUM_GITHUB_COMMENT_LENGTH) {
    throw new Error(
      `The text is too long (maximum is ${configuration.MAXIMUM_GITHUB_COMMENT_LENGTH} characters, actual ${logText.length} characters)"}`,
    );
  }

  const octokit = getOctokit();
  if (commentId === undefined || separateComment) {
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

export async function log(
  logText: string,
  separateComment = false,
): Promise<void> {
  if (configuration.isCI) {
    console.log(logText);
    await logToIssueComment(logText, separateComment);
  } else {
    const fileData = await fs.readFile("log.txt", "utf-8");
    await fs.writeFile("log.txt", fileData + logText + "\n");
  }
}

export async function error(logText: string): Promise<void> {
  if (configuration.isCI) {
    const errorText = "## [Error]\n\n" + "```\n" + logText + "\n```";
    console.log(errorText);
    await logToIssueComment(errorText);
  } else {
    await fs.writeFile("log.txt", "[Error]\n\n" + logText);
  }
}
