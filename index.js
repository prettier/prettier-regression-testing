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

  const BRANCH_NAME = `run-prettier-${prettierPkg.version}`;
  let isCommitted = false;
  for (const repo of repos) {
    const repoPath = path.join(reposDir, repo);
    const latestPrettier = path.join(process.cwd(), "prettier/bin/prettier.js");
    await logPromise(
      `Running latest Prettier on ${repo}`,
      execa(latestPrettier, [path.join(repoPath, repoGlobMap[repo]), "-w"])
    );
    const isChanged = await logPromise(
      `Checking if source code from ${repo} is changed`,
      execa("git", ["diff", "--name-only"]).then(({ stdout }) =>
        stdout.includes(`repos/${repo}`)
      )
    );
    if (isChanged) {
      await logPromise(
        "Commiting changes",
        (async () => {
          if (!isCommitted) {
            await execa("git", ["checkout", "-b", BRANCH_NAME]);
          }
          await execa("git", ["add", "."]);
          await execa("git", [
            "commit",
            "-m",
            `Run latest Prettier on ${repo}`,
          ]);
        })()
      );
      isCommitted = true;
    }
  }

  if (isCommitted) {
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);
    await logPromise(
      "Creating a new Pull Request",
      octokit.pulls.create({
        ...github.context.repo,
        title: `Run Prettier ${prettierPkg.version}`,
        head: BRANCH_NAME,
        base: "master",
      })
    );
  }
})().catch((error) => {
  core.setFailed(error.message);
});
