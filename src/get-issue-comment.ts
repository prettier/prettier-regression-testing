import github from "@actions/github";
import { WebhookPayload } from "@actions/github/lib/interfaces";

export function getIssueComment(): Exclude<
  WebhookPayload["comment"],
  undefined
> {
  const { comment } = github.context.payload;
  if (!comment) {
    throw new Error("'github.context.payload' has no comment.");
  }
  return comment;
}
