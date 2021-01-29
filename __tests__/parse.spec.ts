import { tokenize } from "../src/parse";

describe("parse", () => {
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
