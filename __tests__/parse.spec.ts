import { tokenize, parse } from "../src/parse";

describe("parse", () => {
  describe("parse", () => {
    it("throws syntax error for non-first run", () => {
      expect(() => parse("foo run")).toThrow(
        "A command must start with 'run'."
      );
    });
    it("throws syntax error for 'run' that has no source", () => {
      expect(() => parse("run on")).toThrow(
        "A prettier repository source must be specified for 'run'."
      );
    });
    it("throws syntax error for 'vs' that has no after source", () => {
      expect(() => parse("run foo vs on")).toThrow(
        "A prettier repository source must be specified for 'vs'."
      );
    });
    it("throw syntax error for unsupported 'on'", () => {
      expect(() => parse("run foo on")).toThrow(
        "We haven't supported 'on' yet."
      );
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
