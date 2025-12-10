import * as configuration from "./configuration.ts";
import { ExecuteResultEntry } from "./execute/index.ts";
import { Command } from "./parse.ts";

function getLogTitle(command: Command): string {
  const alternativePrettierRepositoryText = command.alternativePrettier.raw;
  const originalPrettierRepositoryText = command.originalPrettier.raw;
  if (configuration.isCI) {
    return `**${alternativePrettierRepositoryText} VS ${originalPrettierRepositoryText}**`;
  } else {
    return `${alternativePrettierRepositoryText} VS ${originalPrettierRepositoryText}`;
  }
}

const LONG_DIFF_THRESHOLD_IN_LINES = 50;

export function getLogText(
  result: ExecuteResultEntry[],
  command: Command,
): {
  title: string;
  reports: {
    length: number;
    results: {
      head: string;
      diff: string;
      shouldUpload: boolean;
      result: ExecuteResultEntry;
      length: number;
    }[];
  }[];
} {
  const title = getLogTitle(command);

  result = result.toSorted(
    (resultA, resultB) => resultB.diff.length - resultA.diff.length,
  );

  const formattedResults = result.map((report) => {
    const head = report.commitHash;
    const diff = formatDiff(report.diff);
    const length =
      title.length +
      head.length +
      diff.length +
      /* Some room for blank lines */ 50;
    const shouldUpload = length > configuration.MAXIMUM_GITHUB_COMMENT_LENGTH;
    return {
      head,
      diff,
      shouldUpload,
      result: report,
      length: shouldUpload
        ? // Save some space for uploaded url
          200
        : length,
    };
  });

  const group: { length: number; results: typeof formattedResults }[] = [];
  for (const formattedResult of formattedResults) {
    const lastGroup = group.at(-1);

    if (!lastGroup) {
      group.push({
        length: formattedResult.length,
        results: [formattedResult],
      });
      continue;
    }

    if (
      formattedResult.length +
        lastGroup.length +
        /* Some room for blank lines */ 50 >
      configuration.MAXIMUM_GITHUB_COMMENT_LENGTH
    ) {
      group.push({
        length: formattedResult.length,
        results: [formattedResult],
      });
      continue;
    }

    lastGroup.length += formattedResult.length;
    lastGroup.results.push(formattedResult);
  }

  return { title, reports: group };
}

function formatDiff(content: string) {
  if (!content.trim()) {
    return "**The diff is empty.**";
  }
  const lineCount = content.match(/\n/g)?.length ?? 0;
  const code = codeBlock(content, "diff");
  return lineCount > LONG_DIFF_THRESHOLD_IN_LINES
    ? `<details><summary>Diff (${lineCount} lines)</summary>\n\n${code}\n\n</details>`
    : code;
}

function codeBlock(content: string, syntax?: string) {
  const backtickSequences = content.match(/`+/g) || [];
  const longestBacktickSequenceLength = Math.max(
    ...backtickSequences.map(({ length }) => length),
  );
  const fenceLength = Math.max(3, longestBacktickSequenceLength + 1);
  const fence = "`".repeat(fenceLength);
  return [fence + (syntax || ""), content, fence].join("\n");
}
