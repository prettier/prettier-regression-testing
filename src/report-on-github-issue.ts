import assert from "node:assert";
import {
  GITHUB_ACTION_RUN_URL,
  IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT,
  MAXIMUM_GITHUB_COMMENT_LENGTH,
} from "./constants.ts";
import * as logger from "./logger.ts";
import { type Report, stringifyReport } from "./report.ts";

export async function reportOnGithubIssue(report: {
  title: string;
  reports: Report[];
}) {
  if (!IS_TRIGGERED_BY_GITHUB_ISSUE_COMMENT) {
    return;
  }

  await Promise.all(
    [...getComments(report)].map((comment) => logger.report(comment)),
  );
}

function* getComments({
  title,
  reports,
}: {
  title: string;
  reports: Report[];
}) {
  let pending: Report[] = [];

  const canFit = (reports: Report[]) =>
    stringifyReport({ title, reports }).length < MAXIMUM_GITHUB_COMMENT_LENGTH;

  for (const report of reports) {
    if (canFit([...pending, report])) {
      pending.push(report);
      continue;
    }

    if (canFit([report])) {
      yield stringifyReport({ title, reports: pending });
      pending = [report];
      continue;
    }

    const shortReport = {
      head: report.head,
      body: `**Visit [this link](${GITHUB_ACTION_RUN_URL}) to download**`,
    };

    assert.ok(canFit([shortReport]));

    if (canFit([...pending, shortReport])) {
      pending.push(shortReport);
      continue;
    }

    yield stringifyReport({ title, reports: pending });
    pending = [shortReport];
  }

  if (pending.length > 0) {
    yield stringifyReport({ title, reports: pending });
  }
}
