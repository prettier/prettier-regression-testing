import fs from "fs/promises";
import path from "path";
import url from "url";
import execa from "execa";
import * as github from "@actions/github";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let octokit;
function getOctokit() {
  if (!octokit) {
    octokit = github.getOctokit(process.env.GITHUB_TOKEN);
  }
  return octokit;
}

async function updateProjectsJsonFile() {
  const projectsJsonPath = path.join(__dirname, "..", "projects.json");
  const projects = JSON.parse(await fs.readFile(projectsJsonPath, "utf-8"));
  const octokit = getOctokit();
  const latestCommits = new Map();
  await Promise.all(
    Object.entries(projects).map(async ([projectName, { url }]) => {
      const splitted = url.split("/");
      const owner = splitted[3];
      const repo = splitted[4].slice(0, -4);
      const repository = await octokit.repos.get({ owner, repo });
      const defaultBranch = repository.data.default_branch;
      const latestCommit = await octokit.repos.getCommit({
        owner,
        repo,
        ref: defaultBranch,
      });
      const sha = latestCommit.data.sha;
      latestCommits.set(projectName, sha);
    })
  );
  const newProjects = { ...projects };
  for (const [projectName, sha] of latestCommits) {
    newProjects[projectName].commit = sha;
  }
  await fs.writeFile(
    projectsJsonPath,
    JSON.stringify(newProjects, null, 2) + "\n"
  );
}

function getFormattedDate() {
  const date = new Date();
  const dateStr =
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2) +
    "-" +
    ("0" + date.getHours()).slice(-2) +
    "-" +
    ("0" + date.getMinutes()).slice(-2);
  return dateStr;
}

async function createPullRequest() {
  const formattedDate = getFormattedDate();
  const branchName = `update-projects-json-${formattedDate}`;
  await execa("git", ["checkout", "-b", branchName]);
  await updateProjectsJsonFile();

  const { stdout: diff } = await execa("git", ["diff", "--name-only"]);
  if (diff.includes("projects.json")) {
    await execa("git", ["add", "."]);
    await execa("git", ["commit", "-m", `"Update projects.json"`]);
    await execa("git", ["push", "origin", branchName]);
    const octokit = getOctokit();
    await octokit.pulls.create({
      ...github.context.repo,
      title: `Update projects.json (${formattedDate})`,
      head: branchName,
      base: "master",
      maintainer_can_modify: true,
    });
  }
}

process.on("unhandledRejection", function (reason) {
  throw reason;
});

createPullRequest()
  .then(() => {
    console.log("done");
  })
  .catch((e) => {
    throw e;
  });
