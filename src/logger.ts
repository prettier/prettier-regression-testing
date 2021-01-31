import fs from "fs/promises";
import github from "@actions/github";
import * as configuration from "./configuration";
import { getIssueComment } from "./get-issue-comment";
import type { GitHub } from "@actions/github/lib/utils";

type Octokit = InstanceType<typeof GitHub>;
let octokit: Octokit | undefined;
function getOctokit(): Octokit {
  if (octokit === undefined) {
    octokit = github.getOctokit(configuration.authToken);
  }
  return octokit;
}

export async function log(logText: string): Promise<void> {
  if (configuration.isCI) {
    const comment = getIssueComment();
    const octokit = getOctokit();
    console.log(logText);
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

export async function error(logText: string): Promise<void> {
  if (configuration.isCI) {
    const comment = getIssueComment();
    const octokit = getOctokit();
    const errorText = "## [Error]\n\n" + "```\n" + logText + "```";
    console.log(errorText);
    await octokit.issues.updateComment({
      ...github.context.repo,
      comment_id: comment.id,
      body: errorText,
    });
  } else {
    await fs.writeFile("log.txt", "[Error]\n\n" + logText);
  }
}
