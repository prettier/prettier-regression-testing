import fs from "fs/promises";
import path from "path";
import url from "url";
import * as github from "@actions/github";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectsJsonPath = path.join(__dirname, "projects.json");

const projects = JSON.parse(await fs.readFile(projectsJsonPath, "utf-8"));

const octokit = github.getOctokit(process.env.NODE_AUTH_TOKEN);

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

console.log("Done");
