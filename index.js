const path = require("path");
const fs = require("fs/promises");
const execa = require("execa");
const core = require("@actions/core");
const github = require("@actions/github");
const { logPromise, getPrettyCommitHash } = require("./utils");

const repoGlobMap = Object.freeze({
  "typescript-eslint": "./**/*.{ts,js,json,md}",
  "eslint-plugin-vue": "./**/*.js",
});

(async () => {
  const prettierPath = path.join(process.cwd(), "prettier");
  const latestPrettier = path.join(process.cwd(), "prettier/bin/prettier.js");

  const PREFIX = "run with checking out ";
  const commentBody = github.context.payload.comment.body;
  if (commentBody.startsWith(PREFIX)) {
    const checkOutTarget = commentBody.replace(PREFIX, "");
    await logPromise(
      `Checking out to prettier/prettier@${checkOutTarget}`,
      execa("git", ["checkout", checkOutTarget], { cwd: prettierPath })
    );
  }

  await logPromise(
    "installing dependencies",
    execa("npm", ["i"], { cwd: prettierPath })
  );

  const reposDir = path.join(process.cwd(), "repos");
  const repos = await fs.readdir(reposDir);

  const results = await Promise.all(
    repos.map(async (repo) => {
      const repoPath = path.join(reposDir, repo);
      await logPromise(
        `Running latest Prettier on ${repo}`,
        execa(
          path.relative(repoPath, latestPrettier),
          ["--write", JSON.stringify(repoGlobMap[repo])],
          { cwd: repoPath, shell: true }
        )
      );
      const prettyCommitHash = await getPrettyCommitHash(repoPath);
      return { prettyCommitHash };
    })
  );
  const diff = await logPromise(
    "Getting diff of submodules",
    execa("git", ["diff", "--submodule=diff", "repos"]).then(
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
      const reposList = results.reduce((prev, { prettyCommitHash }) => {
        const item = `- ${prettyCommitHash}\n`;
        return prev + item;
      }, "");
      const prettyCommitHash = await getPrettyCommitHash(prettierPath);
      if (diff) {
        const heading = `Diff by ${prettyCommitHash}\n`;
        const diffCodeBlock = "```diff\n" + diff + "\n```";
        await createIssueComment(heading + reposList + diffCodeBlock);
      } else {
        await createIssueComment(
          `There is no diff by ${prettyCommitHash}` + "\n" + reposList
        );
      }
    })()
  );
  console.log("Done");
})().catch((error) => {
  core.setFailed(error.message);
});
