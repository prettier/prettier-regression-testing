import semver from "semver";

export const sourceTypes = {
  version: "version",
  repositoryAndRef: "repositoryAndRef",
  prNumber: "prNumber",
};

export type PrettierRepositorySource =
  | {
      type: typeof sourceTypes.version;
      version: string;
    }
  | {
      type: typeof sourceTypes.repositoryAndRef;
      repositoryAndRef: string;
    }
  | {
      type: typeof sourceTypes.prNumber;
      prNumber: string;
    };

export type Project = {
  repositoryUrl: string;
};

export interface Command {
  alternativePrettier: PrettierRepositorySource;
  originalPrettier: PrettierRepositorySource;
}

const defaultPrettierRepositorySource = {
  type: sourceTypes.repositoryAndRef,
  repositoryAndRef: "prettier/prettier#main",
};
export function parse(source: string): Command {
  const tokens = tokenize(source);

  let alternativePrettier: PrettierRepositorySource | undefined = undefined;
  let originalPrettier: PrettierRepositorySource = defaultPrettierRepositorySource;

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
          "A prettier repository source must be specified for 'run'."
        );
      }
      continue;
    }

    if (match("vs")) {
      if (lookahead().kind !== "source") {
        throw new SyntaxError(
          "A prettier repository source must be specified for 'vs'."
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
          `Unexpected token '${token.kind}', expect 'run' or 'vs'.`
        );
      }
    }
  }

  return { alternativePrettier, originalPrettier } as Command;
}

export function parseRepositorySource(token: Token): PrettierRepositorySource {
  if (token.kind !== "source") {
    throw new Error(`Unexpected token '${token.kind}', expect 'source'.`);
  }

  const { value } = token;

  // lile "2.3.4"
  if (semver.valid(value)) {
    return {
      type: sourceTypes.version,
      version: value,
    };
  }

  // like "sosukesuzuki/prettier#ref"
  const splitted = value.split("/").filter(Boolean);
  if (value.split("/").length === 2) {
    if (splitted[1].split("#").filter(Boolean).length === 2) {
      return {
        type: sourceTypes.repositoryAndRef,
        repositoryAndRef: value,
      };
    }
  }

  // like "#3465"
  const matched = value.match(/\b\d{1,5}\b/g);
  if (value.startsWith("#") && matched) {
    return {
      type: sourceTypes.prNumber,
      prNumber: matched[0],
    };
  }

  throw new SyntaxError(`Unexpected source value '${value}'.`);
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
  for (const word of source.split(" ").filter(Boolean)) {
    switch (word) {
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
