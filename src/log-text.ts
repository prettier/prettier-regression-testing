import * as configuration from "./configuration";
import { ExecuteResult } from "./execute";
import { Command, PrettierRepositorySource } from "./parse";

function getPrettierRepositorySourceText(
  prettierRepositorySource: PrettierRepositorySource
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
    command.alternativePrettier
  );
  const originalPrettierRepositoryText = getPrettierRepositorySourceText(
    command.originalPrettier
  );
  if (configuration.isCI) {
    return `**${alternativePrettierRepositoryText} VS ${originalPrettierRepositoryText}**`;
  } else {
    return `${alternativePrettierRepositoryText} VS ${originalPrettierRepositoryText}`;
  }
}

const LONG_DIFF_THRESHOLD_IN_LINES = 50;

export function getLogText(result: ExecuteResult, command: Command): string {
  let logText = "";
  if (!configuration.isCI) {
    logText = logText + "\n========= Result =========\n\n";
  }
  logText = logText + getLogTitle(command) + "\n\n";
  for (const targetRepositoryPrettyCommitHash of result.targetRepositoriesPrettyheadCommitHashList) {
    logText = logText + `- ${targetRepositoryPrettyCommitHash}\n`;
  }
  logText = logText + "\n";
  if (configuration.isCI) {
    if (result.diffString.trim()) {
      const lineCount = result.diffString.match(/\n/g)?.length ?? 0;
      const isLong = lineCount > LONG_DIFF_THRESHOLD_IN_LINES;
      if (isLong) {
        logText += `<details><summary>Diff (${lineCount} lines)</summary>\n\n`;
      }
      logText += codeBlock(result.diffString, "diff");
      if (isLong) {
        logText += "\n\n</details>";
      }
    } else {
      logText += "**The diff is empty.**";
    }
  } else {
    logText = logText + result.diffString;
    logText = logText + "\n\n========= End of Result =========\n";
  }
  return logText;
}

function codeBlock(content: string, syntax?: string) {
  const backtickSequences = content.match(/`+/g) || [];
  const longestBacktickSequenceLength = Math.max(
    ...backtickSequences.map(({ length }) => length)
  );
  const fenceLength = Math.max(3, longestBacktickSequenceLength + 1);
  const fence = "`".repeat(fenceLength);
  return [fence + (syntax || ""), content, fence].join("\n");
}
