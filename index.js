const path = require("path");
const fs = require("fs/promises");
const execa = require("execa");
const core = require("@actions/core");
const github = require("@actions/github");
const {
  logPromise,
  getPrettyCommitHash,
  parseTarget,
  getRepoFullName,
} = require("./utils");

const repoGlobMap = Object.freeze({
  "typescript-eslint": "./**/*.{ts,js,json,md}",
  "eslint-plugin-vue": "./**/*.js",
  babel: "./{packages,codemodes,eslint}/**/*.js",
  excalidraw: "./**/*.{css,scss,json,md,html,yml}",
  prettier: ".",
});
const repoIgnorePathMap = Object.freeze({
  excalidraw: ".eslintignore",
  babel: ".eslintignore",
});

(async () => {
  const prettierPath = path.join(process.cwd(), "prettier");
  const latestPrettier = path.join(process.cwd(), "prettier/bin/prettier.js");

  const commentBody = github.context.payload.comment.body;
  const { type, ref, repo, pr } = parseTarget(commentBody);
  console.log({ type, ref, repo, pr });
  let prettierPrettyCommitHash;
  if (type === "pr") {
    prettierPrettyCommitHash = `[Prettier PR ${pr}](https://github.com/prettier/prettier/pull/${pr})`;
    await logPromise(`Installing GitHub CLI`, execa("brew", ["install", "gh"]));
    await logPromise(
      `Login Github CLI`,
      execa("gh", ["auth", "login", "--with-token"], {
        input: process.env.NODE_AUTH_TOKEN,
      })
    );
    await logPromise(
      `Checking out PR ${pr}`,
      execa("gh", ["pr", "checkout", pr], { cwd: prettierPath })
    );
  } else {
    if (repo) {
      prettierPrettyCommitHash = `${repo}@${ref}`;
      await logPromise(
        `Checking out ${repo}@${ref}`,
        (async () => {
          const remoteName = repo.split("/")[0];
          const repoFullName = getRepoFullName(repo);
          await execa("git", ["remote", "add", remoteName, repoFullName], {
            cwd: prettierPath,
          });
          await execa("git", ["fetch", remoteName], { cwd: prettierPath });
          await execa("git", ["checkout", ref], {
            cwd: prettierPath,
          });
        })()
      );
    } else if (ref) {
      prettierPrettyCommitHash = `prettier/prettier@${ref}`;
      await logPromise(
        `Checking out prettier/prettier@${ref}`,
        execa("git", ["checkout", ref], { cwd: prettierPath })
      );
    } else {
      prettierPrettyCommitHash = await getPrettyCommitHash(prettierPath);
    }
  }

  await logPromise(
    "installing dependencies",
    execa("yarn", [], { cwd: prettierPath })
  );

  const reposDir = path.join(process.cwd(), "repos");
  const repos = await fs.readdir(reposDir);

  const results = await Promise.all(
    repos.map(async (repo) => {
      const repoPath = path.join(reposDir, repo);
      await logPromise(
        `Running latest Prettier on ${repo}`,
        (async () => {
          const ignorePath = repoIgnorePathMap[repo];
          await execa(
            path.relative(repoPath, latestPrettier),
            ["--write", JSON.stringify(repoGlobMap[repo])].concat(
              ignorePath ? ["--ignore-path", ignorePath] : []
            ),
            { cwd: repoPath, shell: true }
          );
        })()
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
      if (diff) {
        const heading = `Diff by ${prettierPrettyCommitHash}\n`;
        const diffCodeBlock = "```diff\n" + diff + "\n```";
        await createIssueComment(heading + reposList + diffCodeBlock);
      } else {
        await createIssueComment(
          `There is no diff by ${prettierPrettyCommitHash}` + "\n" + reposList
        );
      }
    })()
  );
  console.log("Done");
})().catch((error) => {
  core.setFailed(error.message);
});
