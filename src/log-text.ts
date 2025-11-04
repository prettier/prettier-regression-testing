import * as configuration from "./configuration";
import { ExecuteResultEntry } from "./execute";
import { Command, PrettierRepositorySource } from "./parse";

function getPrettierRepositorySourceText(
  prettierRepositorySource: PrettierRepositorySource,
) {
  switch (prettierRepositorySource.type) {
    case "prNumber": {
      return configuration.isCI
        ? `prettier/prettier#${prettierRepositorySource.prNumber}`
        : `https://github.com/prettier/prettier/pull/${prettierRepositorySource.prNumber}`;
    }
    case "repositoryAndRef": {
      return configuration.isCI
        ? `${prettierRepositorySource.repositoryName}@${prettierRepositorySource.ref}`
        : `https://github.com/${prettierRepositorySource.repositoryName}/blob/${prettierRepositorySource.ref}/README.md`;
    }
    case "version": {
      const versionUrl = `https://github.com/prettier/prettier/tree/${prettierRepositorySource.version}`;
      return configuration.isCI
        ? `[prettier/prettier@${prettierRepositorySource.version}](${versionUrl})`
        : versionUrl;
    }
  }
}
function getLogTitle(command: Command): string {
  const alternativePrettierRepositoryText = getPrettierRepositorySourceText(
    command.alternativePrettier,
  );
  const originalPrettierRepositoryText = getPrettierRepositorySourceText(
    command.originalPrettier,
  );
  if (configuration.isCI) {
    return `**${alternativePrettierRepositoryText} VS ${originalPrettierRepositoryText}**`;
  } else {
    return `${alternativePrettierRepositoryText} VS ${originalPrettierRepositoryText}`;
  }
}

const LONG_DIFF_THRESHOLD_IN_LINES = 50;

const TOO_LONG_DIFF_THRESHOLD_IN_CHARACTERS = 60000;

export function getLogText(
  result: ExecuteResultEntry[],
  command: Command,
): {
  length: number;
  results: {
    head: string;
    diff: string;
    shouldUpload: boolean;
    result: ExecuteResultEntry;
    length: number;
  }[];
}[] {
  const title = getLogTitle(command);

  result = result.toSorted(
    (resultA, resultB) => resultB.diff.length - resultA.diff.length,
  );

  const formattedResults = result.map((report) => {
    const head = `${title} :: ${report.commitHash}`;
    const diff = formatDiff(report.diff);
    const length = head.length + diff.length;
    const shouldUpload = length > TOO_LONG_DIFF_THRESHOLD_IN_CHARACTERS;
    return {
      head,
      diff,
      shouldUpload,
      result: report,
      length: shouldUpload ? 20 : length,
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
      formattedResult.length + lastGroup?.length >
      TOO_LONG_DIFF_THRESHOLD_IN_CHARACTERS
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

  return group;
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
