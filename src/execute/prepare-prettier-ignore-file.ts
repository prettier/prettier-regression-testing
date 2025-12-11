import path from "node:path";
import { type Repository } from "../repositories.ts";
import { writeFile, readFile, unique } from "../utilities.ts";

export async function preparePrettierIgnoreFile({
  directory,
  repository,
}: {
  directory: string;
  repository: Repository;
}): Promise<void> {
  const files = unique(
    [".prettierignore", repository.ignoreFile].filter(Boolean),
  );

  const contents = await Promise.all(
    files.map((file) => readFile(path.join(directory, file!))),
  );

  const content = [...contents, ...repository.ignore].join("\n");

  const prettierIgnoreFile = path.join(directory, ".prettierignore");
  await writeFile(prettierIgnoreFile, content);
}
