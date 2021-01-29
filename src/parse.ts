export const commandTypes = {
  version: "version",
  repositoryAndRef: "repository-and-ref",
  prNumber: "pr-number",
};

export type PrettierRepositorySource =
  | {
      type: typeof commandTypes.version;
      version: string;
    }
  | {
      type: typeof commandTypes.repositoryAndRef;
      repositoryAndRef: string;
    }
  | {
      type: typeof commandTypes.prNumber;
      number: number;
    };

export type Project = {
  repositoryUrl: string;
};

export interface Command {
  alternativePrettier?: PrettierRepositorySource;
  originalPrettier: PrettierRepositorySource;
  projects: [];
}

export function parse(source: string): Command {
  const tokens = tokenize(source);
  let alternativePrettier: PrettierRepositorySource | undefined;
  let originalPrettier: PrettierRepositorySource | undefined;
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
  return { alternativePrettier, originalPrettier, projects: [] };
}

function parseRepositorySource(token: Token) {
  if (token.kind !== "source") {
    throw new Error(`Unexpected token '${token.kind}', expect 'source'.`);
  }

  const { value } = token;

  return {
    type: commandTypes.version,
    version: "2.0",
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
