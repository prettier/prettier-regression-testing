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
  alternativePrettier: PrettierRepositorySource;
  originalPrettier: PrettierRepositorySource;
  projects: [];
}

// export function parse(source: string): Command {}

type Token =
  | {
      kind: "run" | "vs" | "on";
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
