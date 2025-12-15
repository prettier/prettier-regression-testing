import { getRepositories, type Repository } from "./repositories.ts";

export const PRETTIER_PACKAGE_TYPE_PULL_REQUEST = "PULL_REQUEST";
export const PRETTIER_PACKAGE_TYPE_PACKAGE = "PACKAGE";

type PrettierPackage = {
  type: typeof PRETTIER_PACKAGE_TYPE_PACKAGE;
  version: string;
  raw: string;
};

type PrettierPullRequest = {
  type: typeof PRETTIER_PACKAGE_TYPE_PULL_REQUEST;
  number: string;
  raw: string;
};

type PrettierVersionWithoutKind = PrettierPackage | PrettierPullRequest;

type AlternativePrettierKind = { kind: "alternative" };
type OriginalPrettierKind = { kind: "original" };

type AlternativePrettier = PrettierVersionWithoutKind & AlternativePrettierKind;
type OriginalPrettier = PrettierVersionWithoutKind & OriginalPrettierKind;

export type PrettierVersion = AlternativePrettier | OriginalPrettier;

export const defaultOriginalPrettierVersion: OriginalPrettier = {
  kind: "original",
  type: PRETTIER_PACKAGE_TYPE_PACKAGE,
  version: "prettier/prettier",
  raw: "prettier/prettier",
};

export function parseCommand(source: string) {
  const regexp =
    /^RUN\s+(?<alternative>[^\s]+)(?:\s+VS\s+(?<original>[^\s]+))?(?:\s+ON\s+(?<repositories>[^\s]+))?$/i;
  const groups = source.trim().match(regexp)?.groups;
  if (!groups) {
    throw new Error(`Malformed command '${source}'`);
  }

  const alternative: AlternativePrettier = parsePrettierVersion(
    groups.alternative,
    "alternative",
  );

  const original: OriginalPrettier = groups.original
    ? parsePrettierVersion(groups.original, "original")
    : defaultOriginalPrettierVersion;

  const repositories = parseRepositories(groups.repositories);

  return { alternative, original, repositories };
}

function parseRepositories(repositories: string | undefined) {
  const allRepositories = getRepositories();
  if (typeof repositories !== "string") {
    return allRepositories;
  }

  const shouldRun = repositories
    .split(",")
    .map((repository) => repository.trim())
    .filter(Boolean);

  if (shouldRun.length === 0) {
    throw new Error(`'repositories' required after 'ON' directive.`);
  }

  const result: Repository[] = [];
  for (const repository of shouldRun) {
    const matched = allRepositories.find(
      (searching) => searching.repository === repository,
    );

    if (!matched) {
      throw new Error(`Unknown repository '${repository}'.`);
    }

    if (result.includes(matched)) {
      throw new Error(`Duplicated repository '${repository}'.`);
    }

    result.push(matched);
  }

  return result;
}

function parsePrettierVersion<Kind extends PrettierVersion["kind"]>(
  raw: string,
  kind: Kind,
): PrettierVersionWithoutKind & { kind: Kind } {
  // like "#3465"
  if (/^#\d+$/.test(raw)) {
    return {
      kind,
      type: PRETTIER_PACKAGE_TYPE_PULL_REQUEST,
      number: raw.slice(1),
      raw,
    };
  }

  // Any source yarn accepts https://yarnpkg.com/cli/add
  // `sosukesuzuki/prettier#ref`, `3.0.0`, ... and so on
  const packagePrefix = "prettier@";
  let version = raw;
  if (version.startsWith(packagePrefix)) {
    version = version.slice(packagePrefix.length);
  }

  return {
    kind,
    type: PRETTIER_PACKAGE_TYPE_PACKAGE,
    version,
    raw,
  };
}
