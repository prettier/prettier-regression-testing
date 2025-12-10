export const sourceTypes = {
  pullRequest: 'pull-request',
  package: 'package',
} as const;

export interface PrettierPackage {
  type: typeof sourceTypes.package;
  version: string,
  raw?: string;
}

export interface PrettierPullRequest {
  type: typeof sourceTypes.pullRequest;
  number: string,
  raw?: string;
}


export type PrettierVersion =
  | PrettierPackage
  | PrettierPullRequest;

export type Project = {
  repositoryUrl: string;
};

export interface Command {
  alternativePrettier: PrettierVersion;
  originalPrettier: PrettierVersion;
}

const defaultPrettierRepositorySource: PrettierVersion = {
  type: sourceTypes.package,
  version: "prettier/prettier",
  raw: "prettier/prettier",
};
export function parse(source: string): Command {
  const tokens = tokenize(source);

  let alternativePrettier: PrettierVersion | undefined = undefined;
  let originalPrettier: PrettierVersion =
    defaultPrettierRepositorySource;

  for (const [index, token] of tokenize(source).entries()) {
    const lookahead = (): Token => {
      return tokens[index + 1];
    };
    const lookbehind = (): Token => {
      return tokens[index - 1];
    };
    const match = (kind: Token["kind"]) => {
      return token.kind === kind;
    };

    if (index === 0 && token.kind !== "run") {
      throw new SyntaxError("A command must start with 'run'.");
    }

    if (match("run")) {
      if (lookahead().kind !== "source") {
        throw new SyntaxError(
          "A prettier repository source must be specified for 'run'.",
        );
      }
      continue;
    }

    if (match("vs")) {
      if (lookahead().kind !== "source") {
        throw new SyntaxError(
          "A prettier repository source must be specified for 'vs'.",
        );
      }
      continue;
    }

    if (match("on")) {
      throw new SyntaxError("We haven't supported 'on' yet.");
    }

    if (match("source")) {
      if (lookbehind().kind === "run") {
        alternativePrettier = parseRepositorySource(token);
      } else if (lookbehind().kind === "vs") {
        originalPrettier = parseRepositorySource(token);
      } else {
        throw new SyntaxError(
          `Unexpected token '${token.kind}', expect 'run' or 'vs'.`,
        );
      }
    }
  }

  return { alternativePrettier, originalPrettier } as Command;
}

export function parseRepositorySource(token: Token): PrettierVersion {
  if (token.kind !== "source") {
    throw new Error(`Unexpected token '${token.kind}', expect 'source'.`);
  }

  const raw = token.value

  // like "#3465"
  if (/^#\d+$/.test(raw)) {
    return {
      type: sourceTypes.pullRequest,
      number: raw.slice(-1),
      raw,
    };
  }

  // Any source yarn accepts https://yarnpkg.com/cli/add
  // `sosukesuzuki/prettier#ref`, `3.0.0`, ... and so on
  const packagePrefix = 'prettier@'
  let version = raw
  if (version.startsWith(packagePrefix)) {
    version = version.slice(packagePrefix.length)
  }

  return {
    type: sourceTypes.package,
    version,
    raw,
  };
}

type Token =
  | {
      kind: "run";
    }
  | {
      kind: "vs";
    }
  | {
      kind: "on";
    }
  | {
      kind: "source";
      value: string;
    };
export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  for (const word of source.trim().split(" ").filter(Boolean)) {
    switch (word.toLowerCase()) {
      case "run":
        tokens.push({ kind: "run" });
        break;
      case "vs":
        tokens.push({ kind: "vs" });
        break;
      case "on":
        tokens.push({ kind: "on" });
        break;
      default:
        tokens.push({ kind: "source", value: word });
    }
  }
  return tokens;
}
