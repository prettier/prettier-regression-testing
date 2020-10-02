// from https://github.com/prettier/prettier/blob/ed961df609992e265483d955b6d74ad0c7c9af8c/scripts/release/utils.js
const execa = require("execa");
const stringWidth = require("string-width");
const chalk = require("chalk");

const OK = chalk.bgGreen.black(" DONE ");
const FAIL = chalk.bgRed.black(" FAIL ");

function fitTerminal(input) {
  const columns = Math.min(process.stdout.columns, 80);
  const WIDTH = columns - stringWidth(OK) + 1;
  if (input.length < WIDTH) {
    input += chalk.dim(".").repeat(WIDTH - input.length - 1);
  }
  return input;
}

function logPromise(name, promise) {
  process.stdout.write(fitTerminal(name));

  return promise
    .then((result) => {
      process.stdout.write(`${OK}\n`);
      return result;
    })
    .catch((err) => {
      process.stdout.write(`${FAIL}\n`);
      throw err;
    });
}

async function getPrettyCommitHash(repoPath) {
  const headCommitHash = await execa("git", ["rev-parse", "HEAD"], {
    cwd: repoPath,
  }).then(({ stdout }) => stdout);
  const remoteUrl = await execa(
    "git",
    ["remote", "get-url", "--all", "origin"],
    { cwd: repoPath }
  ).then(({ stdout }) => stdout);
  const prettyRepoName =
    // TODO: Use better regex?
    remoteUrl.replace("git@github.com:", "").replace(".git", "");
  return `${prettyRepoName}@${headCommitHash}`;
}

module.exports = { logPromise, getPrettyCommitHash };
