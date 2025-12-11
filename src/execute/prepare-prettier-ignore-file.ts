import path from "node:path";
import { type Project } from "../projects.ts";
import { writeFile, readFile, unique } from "../utilities.ts";

export async function preparePrettierIgnoreFile({
  directory,
  project,
}: {
  directory: string;
  project: Project;
}): Promise<void> {
  const files = unique([".prettierignore", project.ignoreFile].filter(Boolean));

  const contents = await Promise.all(
    files.map((file) => readFile(path.join(directory, file!))),
  );

  const content = [...contents, ...project.ignore].join("\n");

  const prettierIgnoreFile = path.join(directory, ".prettierignore");
  await writeFile(prettierIgnoreFile, content);
}
