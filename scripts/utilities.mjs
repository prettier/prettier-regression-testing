import * as prettier from "prettier";
import fs from "fs/promises";
import spawn from "nano-spawn";
import repositories from "../repositories.json" with { type: "json" };

export const REPOSITORIES_JSON_FILE = new URL(
  "../repositories.json",
  import.meta.url,
);

export async function getRepositoryCommitHash(repository) {
  const { stdout } = await spawn("git", [
    "ls-remote",
    "--exit-code",
    `https://github.com/${repository}`,
    "HEAD",
  ]);

  const [commit] = stdout.trim().split(/\s/);
  return commit;
}

export async function updatedRepositories(processFunction) {
  const updated = await processFunction(repositories);

  await fs.writeFile(
    REPOSITORIES_JSON_FILE,
    await prettier.format(JSON.stringify(updated), { parser: "json" }),
  );
}
