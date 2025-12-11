import * as github from "@actions/github";

export function getIssueComment() {
  const { comment } = github.context.payload;
  if (!comment) {
    throw new Error("'github.context.payload' has no comment.");
  }
  return comment;
}
