import * as github from "@actions/github";
import { IS_GITHUB_ACTION, GITHUB_ACTION_RUN_URL } from "./constants.ts";
import { getOctokit } from "./octokit.ts";
import { codeBlock } from "./utilities.ts";
import { inspect } from "node:util";

type Comment = Exclude<Awaited<ReturnType<typeof createComment>>, undefined>;

async function createComment(body: string) {
  if (!IS_GITHUB_ACTION) {
    return;
  }
  const octokit = getOctokit();

  return await octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: github.context.issue.number,
    body,
  });
}

async function updateComment(body: string, comment: Comment) {
  if (!IS_GITHUB_ACTION) {
    return;
  }
  const octokit = getOctokit();

  return await octokit.rest.issues.updateComment({
    ...github.context.repo,
    comment_id: comment.data.id,
    body: body,
  });
}

let briefCommentRequest: ReturnType<typeof createComment> | undefined;
export async function brief(body: string) {
  body += `\n > [Progress](${GITHUB_ACTION_RUN_URL})`;

  if (!briefCommentRequest) {
    briefCommentRequest = createComment(body);
    await briefCommentRequest;
    return;
  }

  const comment = await briefCommentRequest;

  await updateComment(body, comment!);
}

export async function error(error: Error): Promise<void> {
  const text = `
  ### [${error.name}]

  ${codeBlock(inspect(error))}
  `;
  console.error(error);
  await brief(text);
}

export async function report(body: string) {
  console.log(body);

  if (briefCommentRequest) {
    briefCommentRequest = undefined;

    const comment = await briefCommentRequest;
    await updateComment(body, comment!);
    return;
  }

  await createComment(body);
}
