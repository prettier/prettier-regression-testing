import {
  IS_GITHUB_ACTION,
  MAXIMUM_GITHUB_COMMENT_LENGTH,
  GITHUB_ACTION_RUN_URL,
} from "./constants.ts";
import { stringifyReport, type Report } from "./report.ts";
import * as logger from "./logger.ts";
import assert from "node:assert";

export async function reportOnGithubIssue(report: {
  title: string;
  reports: Report[];
}) {
  if (!IS_GITHUB_ACTION) {
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
