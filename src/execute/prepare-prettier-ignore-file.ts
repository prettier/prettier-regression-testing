import path from "node:path";
import fs from "node:fs/promises";
import { type Project } from "../projects.ts";

async function readFile(file: string) {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return "";
  }
}

const unique = <T>(array: T[]): T[] => [...new Set(array)];

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
  await fs.writeFile(prettierIgnoreFile, content);
}
