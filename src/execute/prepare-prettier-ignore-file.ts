import path from "path";
import fs from "fs";
import { getProjects } from "../projects";

export async function preparePrettierIgnoreFile(
  repositoryPath: string,
  repositoryName: string,
): Promise<void> {
  const projects = await getProjects();
  const project = projects[repositoryName];
  if (!project) {
    throw new Error(`Repository name '${repositoryName}' is invalid`);
  }

  const { ignore, ignoreFile } = project;

  const prettierIgnoreFile = path.join(repositoryPath, "./.prettierignore");
  let prettierIgnoreFileContent = fs.existsSync(prettierIgnoreFile)
    ? await fs.promises.readFile(prettierIgnoreFile, "utf8")
    : "";
  if (ignoreFile) {
    prettierIgnoreFileContent +=
      "\n" +
      (await fs.promises.readFile(
        path.join(repositoryPath, ignoreFile),
        "utf8",
      ));
  }
  if (ignore) {
    prettierIgnoreFileContent +=
      "\n" + (Array.isArray(ignore) ? ignore.join("\n") : ignore);
  }

  await fs.promises.writeFile(prettierIgnoreFile, prettierIgnoreFileContent);
}
