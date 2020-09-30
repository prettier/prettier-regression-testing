const path = require("path");
const fs = require("fs");
const execa = require("execa");
const prettierPkg = require("./prettier/package.json");
const core = require("@actions/core");
const github = require("@actions/github");
const { logPromise } = require("./utils");
const { promisify } = require("util");

const readdir = promisify(fs.readdir);

const repoGlobMap = Object.freeze({
  "typescript-eslint": "./**/*.{ts,js,json,md}",
});

(async () => {
  await logPromise(
    "installing dependencies",
    execa("npm", ["i"], { cwd: path.join(process.cwd(), "prettier") })
  );

  const reposDir = path.join(process.cwd(), "repos");
  const repos = await readdir(reposDir);

  const BRANCH_NAME = `run-prettier-${prettierPkg.version}`;
  let isCommitted = false;
  for (const repo of repos) {
    const repoPath = path.join(reposDir, repo);
    const latestPrettier = path.join(process.cwd(), "prettier/bin/prettier.js");
    await logPromise(
      `Running latest Prettier on ${repo}`,
      // FIXME: Glob not working
      execa(latestPrettier, [path.join(repoPath, repoGlobMap[repo]), "-w"])
    );
    const isChanged = await logPromise(
      `Checking if source code from ${repo} is changed`,
      execa("git", ["diff", "--name-only"]).then(({ stdout }) =>
        stdout.includes(`repos/${repo}`)
      )
    );
    if (isChanged) {
      // TODO: Support submodules
      await logPromise(
        "Commiting changes",
        (async () => {
          if (!isCommitted) {
            await execa("git", ["checkout", "-b", BRANCH_NAME]);
          }
          await execa("git", ["add", "."], { cwd: repoPath });
          await execa(
            "git",
            ["commit", "-m", `Run latest Prettier on ${repo}`],
            { cwd: repoPath }
          );
        })()
      );
      isCommitted = true;
    }
  }

  if (isCommitted) {
    await logPromise(
      "Commiting submodule changes",
      (async () => {
        await execa("git", ["add", "."]);
        await execa("git", ["commit", "-m", `Update via ${prettierPkg.version}`]);
      })()
    );
    const token = process.env.NODE_AUTH_TOKEN;
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
  } else {
    console.log(`There is not change by ${prettierPkg.version}`);
  }
  console.log("Done");
})().catch((error) => {
  core.setFailed(error.message);
});
