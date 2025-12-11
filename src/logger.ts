import fs from "fs/promises";
import * as github from "@actions/github";
import { IS_CI, MAXIMUM_GITHUB_COMMENT_LENGTH } from "./constants.ts";
import { getOctokit } from "./octokit.ts";

let commentId: number | undefined;
async function logToIssueComment(logText: string, separateComment = false) {
  if (logText.length > MAXIMUM_GITHUB_COMMENT_LENGTH) {
    throw new Error(
      `The text is too long (maximum is ${MAXIMUM_GITHUB_COMMENT_LENGTH} characters, actual ${logText.length} characters)"}`,
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
  if (IS_CI) {
    console.log(logText);
    await logToIssueComment(logText, separateComment);
  } else {
    const fileData = await fs.readFile("log.txt", "utf-8");
    await fs.writeFile("log.txt", fileData + logText + "\n");
  }
}

export async function error(logText: string): Promise<void> {
  if (IS_CI) {
    const errorText = "## [Error]\n\n" + "```\n" + logText + "\n```";
    console.log(errorText);
    await logToIssueComment(errorText);
  } else {
    await fs.writeFile("log.txt", "[Error]\n\n" + logText);
  }
}
