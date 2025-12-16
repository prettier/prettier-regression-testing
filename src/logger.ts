import { inspect } from "node:util";
import * as github from "@actions/github";
import { outdent } from "outdent";
import {
  GITHUB_ACTION_JOB_URL,
  IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT,
} from "./constants.ts";
import { getOctokit } from "./octokit.ts";
import { printMarkdownCodeBlock, printMarkdownDetails } from "./utilities.ts";

type Comment = Awaited<ReturnType<typeof createComment>>;

async function createComment(body: string) {
  const octokit = getOctokit();

  return await octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: github.context.issue.number,
    body,
  });
}

async function updateComment(body: string, comment: Comment) {
  const octokit = getOctokit();

  return await octokit.rest.issues.updateComment({
    ...github.context.repo,
    comment_id: comment.data.id,
    body: body,
  });
}

let briefCommentRequest: ReturnType<typeof createComment> | undefined;
const messages: { time: Date; message: string }[] = [];
export async function brief(message: string) {
  console.log(message);

  if (!IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT) {
    return;
  }

  messages.push({ time: new Date(), message });

  const body = outdent`
    ${messages.map(({ time, message }) => `[${time.toISOString()}]: ${message}`).join("\n")}

    _[details](${GITHUB_ACTION_JOB_URL})_
  `;

  if (briefCommentRequest) {
    const comment = await briefCommentRequest;
    try {
      return await updateComment(body, comment);
    } catch {
      // No op
    }
  }

  briefCommentRequest = createComment(body);
  return await briefCommentRequest;
}

export async function error(error: Error) {
  console.error(error);
  if (!IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT) {
    return;
  }

  const text = printMarkdownDetails(
    `[${error.name}](${error.message})`,
    printMarkdownCodeBlock(inspect(error)),
  );

  return await brief(text);
}

export async function report(body: string) {
  console.log(body);

  if (briefCommentRequest) {
    const request = briefCommentRequest;
    briefCommentRequest = undefined;

    try {
      const comment = await request;
      return await updateComment(body, comment);
    } catch {
      // No op
    }
  }

  return await createComment(body);
}
