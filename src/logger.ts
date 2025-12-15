import * as github from "@actions/github";
import { IS_GITHUB_ACTION, GITHUB_ACTION_JOB_URL } from "./constants.ts";
import { getOctokit } from "./octokit.ts";
import { codeBlock } from "./utilities.ts";
import { inspect } from "node:util";

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
export async function brief(body: string) {
  console.log(body);

  if (!IS_GITHUB_ACTION) {
    return;
  }

  body += `\n__[details](${GITHUB_ACTION_JOB_URL})__`;

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
  if (!IS_GITHUB_ACTION) {
    return;
  }

  const text = `
  ### [${error.name}]

  ${codeBlock(inspect(error))}
  `;
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
