import { tokenize, parse, parseRepositorySource } from "../src/parse";

describe("parse", () => {
  describe("parse", () => {
    it("throws syntax error for non-first run", () => {
      expect(() => parse("2.0.0 run")).toThrow(
        "A command must start with 'run'."
      );
    });
    it("throws syntax error for 'run' that has no source", () => {
      expect(() => parse("run on")).toThrow(
        "A prettier repository source must be specified for 'run'."
      );
    });
    it("throws syntax error for 'vs' that has no after source", () => {
      expect(() => parse("run 2.0.0 vs on")).toThrow(
        "A prettier repository source must be specified for 'vs'."
      );
    });
    it("throw syntax error for unsupported 'on'", () => {
      expect(() => parse("run 2.0.0 on")).toThrow(
        "We haven't supported 'on' yet."
      );
    });
  });

  describe("parseRepositorySource", () => {
    it("returns an object represents version", () => {
      const source = parseRepositorySource({ kind: "source", value: "2.1.2" });
      expect(source).toEqual({
        type: "version",
        version: "2.1.2",
      });
    });
    it("returns an object represents PR number", () => {
      const source = parseRepositorySource({ kind: "source", value: "#2333" });
      expect(source).toEqual({
        type: "prNumber",
        prNumber: "2333",
      });
    });
    it("returns an object represents repository and ref", () => {
      const source = parseRepositorySource({
        kind: "source",
        value: "sosukesuzuki/prettier#ref",
      });
      expect(source).toEqual({
        type: "repositoryAndRef",
        repositoryAndRef: "sosukesuzuki/prettier#ref",
      });
    });
    it("throws syntax error for invalid source token", () => {
      expect(() =>
        parseRepositorySource({ kind: "source", value: "" })
      ).toThrow("Unexpected source value ''.");
      expect(() =>
        parseRepositorySource({ kind: "source", value: "foobar" })
      ).toThrow("Unexpected source value 'foobar'.");
    });
  });

  describe("tokenize", () => {
    it("returns 'run' token", () => {
      const tokens = tokenize("run");
      expect(tokens).toEqual([{ kind: "run" }]);
    });
    it("returns 'vs' token", () => {
      const tokens = tokenize("vs");
      expect(tokens).toEqual([{ kind: "vs" }]);
    });
    it("returns 'on' token", () => {
      const tokens = tokenize("on");
      expect(tokens).toEqual([{ kind: "on" }]);
    });
    it("returns source token", () => {
      const tokens = tokenize("source");
      expect(tokens).toEqual([{ kind: "source", value: "source" }]);
    });
    it("returns 'run', 'vs', 'on' tokens", () => {
      const tokens = tokenize("run vs on");
      expect(tokens).toEqual([{ kind: "run" }, { kind: "vs" }, { kind: "on" }]);
    });
    it("returns mixed tokens", () => {
      const tokens = tokenize("run foo vs bar on a b c");
      expect(tokens).toEqual([
        { kind: "run" },
        { kind: "source", value: "foo" },
        { kind: "vs" },
        { kind: "source", value: "bar" },
        { kind: "on" },
        { kind: "source", value: "a" },
        { kind: "source", value: "b" },
        { kind: "source", value: "c" },
      ]);
    });
  });
});
