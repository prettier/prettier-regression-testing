const path = require("path");
const fs = require("fs/promises");
const execa = require("execa");
const core = require("@actions/core");
const github = require("@actions/github");
const { logPromise } = require("./utils");

const repoGlobMap = Object.freeze({
  "typescript-eslint": "./**/*.{ts,js,json,md}",
});

(async () => {
  const prettierPath = path.join(process.cwd(), "prettier");
  await logPromise(
    "installing dependencies",
    execa("npm", ["i"], { cwd: prettierPath })
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
  }
  const diff = await logPromise(
    "Getting diff of submodules",
    execa("git", ["diff", "--submodule=diff", "repos"]).then(
      ({ stdout }) => stdout
    )
  );
  const prettierCommitHash = await logPromise(
    "Getting head commit hash of Prettier",
    execa("git", ["rev-parse", "HEAD"], { cwd: prettierPath }).then(
      ({ stdout }) => stdout
    )
  );
  await logPromise(
    "Creating issue comment",
    (async () => {
      const token = process.env.NODE_AUTH_TOKEN;
      const octokit = github.getOctokit(token);
      const createIssueComment = (body) =>
        octokit.issues.createComment({
          ...github.context.repo,
          issue_number: github.context.issue.number,
          body,
        });
      const prettyCommitHash = `prettier/prettier@${prettierCommitHash}`;
      if (diff) {
        const body =
          `Diff by ${prettyCommitHash}\n` + "```diff\n" + diff + "\n```";
        await createIssueComment(body);
      } else {
        await createIssueComment(`There is no diff by ${prettyCommitHash}`);
      }
    })()
  );
  console.log("Done");
})().catch((error) => {
  core.setFailed(error.message);
});
