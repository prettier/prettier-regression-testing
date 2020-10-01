const path = require("path");
const fs = require("fs/promises");
const execa = require("execa");
const prettierPkg = require("./prettier/package.json");
const core = require("@actions/core");
const github = require("@actions/github");
const { logPromise } = require("./utils");

const repoGlobMap = Object.freeze({
  "typescript-eslint": "./**/*.{ts,js,json,md}",
});

(async () => {
  await logPromise(
    "installing dependencies",
    execa("npm", ["i"], { cwd: path.join(process.cwd(), "prettier") })
  );

  const reposDir = path.join(process.cwd(), "repos");
  const repos = await fs.readdir(reposDir);

  for (const repo of repos) {
    const repoPath = path.join(reposDir, repo);
    const latestPrettier = path.join(process.cwd(), "prettier/bin/prettier.js");
    await logPromise(
      `Running latest Prettier on ${repo}`,
      execa(
        path.relative(repoPath, latestPrettier),
        ["--write", JSON.stringify(repoGlobMap[repo])],
        { cwd: repoPath, shell: true }
      )
    );
    const diff = await logPromise(
      `Printing diff of submodules`,
      execa("git", ["diff", "--submodule=diff", "repos"]).then(
        ({ stdout }) => stdout
      )
    );
    const token = process.env.NODE_AUTH_TOKEN;
    const octokit = github.getOctokit(token);
    const createIssueComment = (body) =>
      octokit.issues.createComment({
        ...github.context.repo,
        issue_number: 2,
        body,
      });
    if (diff) {
      const body = "```diff\n" + diff + "\n```";
      createIssueComment(body);
    } else {
      createIssueComment(`There is no change by ${prettierPkg.version}`);
    }
  }
})().catch((error) => {
  core.setFailed(error.message);
});
