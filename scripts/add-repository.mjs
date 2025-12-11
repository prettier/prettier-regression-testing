import * as readline from "node:readline/promises";
import process from "node:process";
import { getRepositoryCommitHash, updatedRepositories } from "./utilities.mjs";

const GITHUB_DOMAIN = "https://github.com/";

async function addProject() {
  const rl = new readline.Interface({
    input: process.stdin,
    output: process.stdout,
  });
  let input = await rl.question(
    "Which repository are you going to add? Example: prettier/prettier\n",
  );

  let repository = input.trim();

  if (repository.startsWith(GITHUB_DOMAIN)) {
    repository = repository.slice(GITHUB_DOMAIN.length);

    if (repository.endsWith("/")) {
      repository = repository.slice(0, -1);
    }
  }

  if (!/^[\w-]+\/[\w-]+$/.test(repository)) {
    throw new Error(`Unsupported repository '${input}'.`);
  }

  await updatedRepositories(async (repositories) => {
    if (repositories.some((project) => project.repository === repository)) {
      throw new Error(`Repository '${repository}' already exists.`);
    }

    const commit = await getRepositoryCommitHash(repository);
    return [
      repositories,
      {
        repository,
        commit,
        glob: ".",
      },
    ];
  });
}

await addProject();

console.log("done");
