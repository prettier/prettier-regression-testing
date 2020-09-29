const path = require("path");
const fs = require("fs/promises");
const execa = require("execa");
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
    // TODO: Create PR
  }
})();
