import { IS_CI, MAXIMUM_GITHUB_COMMENT_LENGTH } from "./constants.ts";
import { PRETTIER_PACKAGE_TYPE_PULL_REQUEST } from "./parse-command.ts";
import { type PrettierVersion } from "./parse-command.ts";
import { type Repository } from "./repositories.ts";

function getPrettierVersionDescription(prettier: PrettierVersion) {
  if (prettier.type === PRETTIER_PACKAGE_TYPE_PULL_REQUEST) {
    return IS_CI
      ? `prettier/prettier#${prettier.number}`
      : `https://github.com/prettier/prettier/pull/${prettier.number}`;
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

  return IS_CI ? `**${text}**` : text;
}

const LONG_DIFF_THRESHOLD_IN_LINES = 50;

export function getReport({
  alternative,
  original,
  result,
}: {
  alternative: PrettierVersion;
  original: PrettierVersion;
  result: { repository: Repository; diff: string }[];
}): {
  title: string;
  reports: {
    length: number;
    results: {
      head: string;
      diff: string;
      shouldUpload: boolean;
      length: number;
    }[];
  }[];
} {
  const title = getTitle({
    alternative,
    original,
  });

  result = result.toSorted(
    (resultA, resultB) => resultB.diff.length - resultA.diff.length,
  );

  const formattedResults = result.map(({ repository, diff: rawDiff }) => {
    const head = repository.commit;
    const diff = formatDiff(rawDiff);
    const length =
      title.length +
      head.length +
      diff.length +
      /* Some room for blank lines */ 50;
    const shouldUpload = length > MAXIMUM_GITHUB_COMMENT_LENGTH;
    return {
      head,
      diff,
      shouldUpload,
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
      MAXIMUM_GITHUB_COMMENT_LENGTH
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
