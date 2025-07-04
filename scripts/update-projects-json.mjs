import * as prettier from "prettier";
import fs from "fs/promises";
import execa from "execa";

async function updateProjectsJsonFile() {
  const projectsJsonFile = new URL("../projects.json", import.meta.url);
  const projects = JSON.parse(await fs.readFile(projectsJsonFile, "utf-8"));

  await Promise.all(
    Object.values(projects).map(async (project) => {
      const { stdout } = await execa("git", [
        "ls-remote",
        "--exit-code",
        project.url,
        "HEAD",
      ]);
      const [sha] = stdout.trim().split(/\s/);
      project.commit = sha;
    }),
  );

  await fs.writeFile(
    projectsJsonFile,
    await prettier.format(JSON.stringify(projects), { parser: "json" }),
  );
}

await updateProjectsJsonFile();

console.log("done");
