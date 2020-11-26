"use strict";

const assert = require("assert").strict;
const { parseTarget } = require("./utils");

assert.deepEqual(parseTarget("run"), {
  type: "repo",
  repo: undefined,
  ref: undefined,
});
assert.deepEqual(parseTarget("run with pr 1234"), { type: "pr", pr: "1234" });
assert.deepEqual(
  parseTarget("run with checking out d8e40cd978ffe5dae04b63d4901f6e425b6ad29a"),
  {
    type: "repo",
    repo: undefined,
    ref: "d8e40cd978ffe5dae04b63d4901f6e425b6ad29a",
  }
);
assert.deepEqual(
  parseTarget(
    "run with checking out d8e40cd978ffe5dae04b63d4901f6e425b6ad29a on fisker/prettier"
  ),
  {
    type: "repo",
    repo: "fisker/prettier",
    ref: "d8e40cd978ffe5dae04b63d4901f6e425b6ad29a",
  }
);
