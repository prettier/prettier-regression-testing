import { parseCommand } from "../src/parse-command.ts";
import { describe, it, expect } from "vitest";

describe("parse", () => {
  it("returns command obj represents prNumber vs repositoryAndRef", () => {
    const { alternative, original } = parseCommand(
      "run #2345 vs sosukesuzuki/prettier#ref",
    );
    expect({ alternative, original }).toMatchInlineSnapshot(`
      {
        "alternative": {
          "number": "2345",
          "raw": "#2345",
          "type": "PULL_REQUEST",
        },
        "original": {
          "raw": "sosukesuzuki/prettier#ref",
          "type": "PACKAGE",
          "version": "sosukesuzuki/prettier#ref",
        },
      }
    `);
  });
  it("returns command obj represents version vs repositoryAndRef", () => {
    const { alternative, original } = parseCommand(
      "run 2.1.2 vs sosukesuzuki/prettier#ref",
    );
    expect({ alternative, original }).toMatchInlineSnapshot(`
      {
        "alternative": {
          "raw": "2.1.2",
          "type": "PACKAGE",
          "version": "2.1.2",
        },
        "original": {
          "raw": "sosukesuzuki/prettier#ref",
          "type": "PACKAGE",
          "version": "sosukesuzuki/prettier#ref",
        },
      }
    `);
  });
  it("returns command obj represents version vs default", () => {
    const { alternative, original } = parseCommand("run 2.1.2");
    expect({ alternative, original }).toMatchInlineSnapshot(`
      {
        "alternative": {
          "raw": "2.1.2",
          "type": "PACKAGE",
          "version": "2.1.2",
        },
        "original": {
          "raw": "prettier/prettier",
          "type": "PACKAGE",
          "version": "prettier/prettier",
        },
      }
    `);
  });
  it("throws syntax error for non-first run", () => {
    expect(() => parseCommand("2.0.0 run")).toThrowErrorMatchingInlineSnapshot(
      `[Error: Malformed command '2.0.0 run']`,
    );
  });
  it("Support 'on'", () => {
    const { alternative, original, repositories } = parseCommand(
      "run 1.0.0 vs 2.0.0 on https://github.com/babel/babel.git",
    );
    expect({
      alternative,
      original,
      repositories: repositories.map(({ name }) => name),
    }).toMatchInlineSnapshot(`
      {
        "alternative": {
          "raw": "1.0.0",
          "type": "PACKAGE",
          "version": "1.0.0",
        },
        "original": {
          "raw": "2.0.0",
          "type": "PACKAGE",
          "version": "2.0.0",
        },
        "repositories": [
          "babel/babel",
        ],
      }
    `);
    {
      const { alternative, original, repositories } = parseCommand(
        "run 1.0.0 vs 2.0.0 on babel/babel,prettier/prettier",
      );
      expect({
        alternative,
        original,
        repositories: repositories.map(({ name }) => name),
      }).toMatchInlineSnapshot(`
        {
          "alternative": {
            "raw": "1.0.0",
            "type": "PACKAGE",
            "version": "1.0.0",
          },
          "original": {
            "raw": "2.0.0",
            "type": "PACKAGE",
            "version": "2.0.0",
          },
          "repositories": [
            "babel/babel",
            "prettier/prettier",
          ],
        }
      `);
    }
  });
});
