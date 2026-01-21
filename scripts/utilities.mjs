import fs from "fs/promises";
import spawn from "nano-spawn";
import * as prettier from "prettier";
import repositories from "../repositories.json" with { type: "json" };

export const REPOSITORIES_JSON_FILE = new URL(
  "../repositories.json",
  import.meta.url,
);

export async function getRepositoryCommitHash(repository) {
  const { stdout } = await Promise.any(
    [
      `git@github.com:${repository}.git`,
      `https://github.com/${repository}`,
    ].map((repository) =>
      spawn("git", ["ls-remote", "--exit-code", repository, "HEAD"]),
    ),
  );

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
