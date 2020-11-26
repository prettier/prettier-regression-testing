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
    // TODO: Use better regex
    remoteUrl.replace("https://github.com/", "").replace(".git", "");
  return `${prettyRepoName}@${headCommitHash}`;
}

/**
 * @typedef {{type: "repo", ref?: string, repo?: string}} RepoResult
 * @typedef {{type: "pr", pr?: string}} PrResult
 *
 * @param {String} commentBody
  
 * @returns {RepoResult | PrResult}
 */
function parseTarget(commentBody) {
  let { groups: prParseResult } =
    commentBody.match(/^run with pr (?<pr>\d+)$/) || {};
  if (prParseResult) {
    return { type: "pr", ...prParseResult };
  }
  let { groups: repoMatch } =
    commentBody.match(
      /^run( with checking out (?<ref>.*?)(?: on (?<repo>.*?))?)?$/
    ) || {};
  return { type: "repo", ...repoMatch };
}

/**
 * @param {String} repo
 * @returns {String}
 */
function getRepoFullName(repo) {
  const token = process.env.NODE_AUTH_TOKEN;
  return `https://${token}@github.com/${repo}.git`;
}

module.exports = {
  logPromise,
  getPrettyCommitHash,
  parseTarget,
  getRepoFullName,
};
