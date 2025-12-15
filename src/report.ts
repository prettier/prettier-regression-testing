import { PRETTIER_PACKAGE_TYPE_PULL_REQUEST } from "./parse-command.ts";
import { type PrettierVersion } from "./parse-command.ts";
import { type ExecuteCommandResult } from "./execute-command.ts";
import { codeBlock } from "./utilities.ts";
import { outdent } from "outdent";

function getPrettierVersionDescription(prettier: PrettierVersion) {
  if (prettier.type === PRETTIER_PACKAGE_TYPE_PULL_REQUEST) {
    return `[prettier/prettier#${prettier.number}](https://github.com/prettier/prettier/pull/${prettier.number})`;
  }

  return `prettier@${prettier.version} (${prettier.raw})`;
}

function getTitle({
  alternative,
  original,
}: {
  alternative: PrettierVersion;
  original: PrettierVersion;
}): string {
  const text = [alternative, original]
    .map((prettierVersion) => getPrettierVersionDescription(prettierVersion))
    .join(" VS ");

  return `# **${text}**`;
}

const LONG_DIFF_THRESHOLD_IN_LINES = 50;

export type Report = {
  head: string;
  body: string;
};

export const stringifyReport = ({
  title,
  reports,
}: {
  title: string;
  reports: Report[];
}) =>
  [title, ...reports.flatMap(({ head, body }) => [head, body])].join("\n\n");

export function getReport({
  alternative,
  original,
  results: rawResults,
}: ExecuteCommandResult) {
  const title = getTitle({ alternative, original });

  const results = rawResults.map((rawResult) => ({
    ...rawResult,
    text: rawResult.fail
      ? codeBlock(rawResult.stringifiedError)
      : formatDiff(rawResult.diff),
  }));

  results.sort((resultA, resultB) => resultB.text.length - resultA.text.length);

  return {
    title,
    reports: results.map(({ repository, text }, index) => {
      const shortHash = repository.commit.slice(0, 7);
      const head = `## [${index + 1}/${results.length}] [${repository.repository}@${shortHash}](https://github.com/${repository.repository}/tree/${repository.commit})`;
      return {
        head,
        body: text,
      };
    }),
  };
}

function formatDiff(diff: string) {
  if (!diff.trim()) {
    return "**The diff is empty.**";
  }
  const linesCount = diff.split("\n").length;
  const code = codeBlock(diff, "diff");
  return linesCount > LONG_DIFF_THRESHOLD_IN_LINES
    ? outdent`
        <details>
          <summary>Diff (${linesCount} lines)</summary>

          ${code}

        </details>
      `
    : code;
}
