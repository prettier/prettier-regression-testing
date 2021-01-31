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
        : `https://github.com/prettier/prettier/blob/${prettierRepositorySource.ref}/README.md`;
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
    logText = logText + "```diff\n";
    logText = logText + result.diffString;
    logText = logText + "\n```";
  } else {
    logText = logText + result.diffString;
    logText = logText + "\n\n========= End of Result =========\n";
  }
  return logText;
}
