import * as readline from "node:readline/promises";
import process from "node:process";
import * as prettier from "prettier";
import fs from "fs/promises";
import spawn from "nano-spawn";

async function addProject() {
  const rl = new readline.Interface({
    input: process.stdin,
    output: process.stdout,
  });
  let project = await rl.question(
    "What project are you going to add? Example: https://github.com/prettier/prettier\n",
  );
  project = project.trim();
  if (project.endsWith("/")) {
    project = project.slice(0, -1);
  }
  if (!/^https:\/\/github\.com\/[\w]+\/[\w]+$/.test(project)) {
    throw new Error(`Unsupported project '${project}'.`);
  }

  const repository = `${project}.git`;

  const projectsJsonFile = new URL("../projects.json", import.meta.url);
  let projects = JSON.parse(await fs.readFile(projectsJsonFile, "utf-8"));

  if (projects.some((project) => project.repository === repository)) {
    throw new Error(`Project '${project}' already exists.`);
  }

  const { stdout } = await spawn("git", [
    "ls-remote",
    "--exit-code",
    repository,
    "HEAD",
  ]);
  const [sha] = stdout.trim().split(/\s/);

  projects.push({
    repository,
    commit: sha,
    glob: ".",
  });

  await fs.writeFile(
    projectsJsonFile,
    await prettier.format(JSON.stringify(projects), { parser: "json" }),
  );
}

await addProject();

console.log("done");
