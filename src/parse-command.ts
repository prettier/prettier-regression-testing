import { getRepositories, type Repository } from "./repositories.ts";

export const PRETTIER_PACKAGE_TYPE_PULL_REQUEST = "PULL_REQUEST";
export const PRETTIER_PACKAGE_TYPE_PACKAGE = "PACKAGE";

export interface PrettierPackage {
  type: typeof PRETTIER_PACKAGE_TYPE_PACKAGE;
  version: string;
  raw: string;
}

export interface PrettierPullRequest {
  type: typeof PRETTIER_PACKAGE_TYPE_PULL_REQUEST;
  number: string;
  raw: string;
}

export type PrettierVersion = PrettierPackage | PrettierPullRequest;

export interface Command {
  alternative: PrettierVersion;
  original: PrettierVersion;
}

export const defaultOriginalPrettierVersion: PrettierVersion = {
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

  const alternative = parsePrettierVersion(groups.alternative);

  const original = groups.original
    ? parsePrettierVersion(groups.original)
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

function parsePrettierVersion(raw: string): PrettierVersion {
  // like "#3465"
  if (/^#\d+$/.test(raw)) {
    return {
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
    type: PRETTIER_PACKAGE_TYPE_PACKAGE,
    version,
    raw,
  };
}
