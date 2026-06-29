import process from "node:process";
import * as readline from "node:readline/promises";
import { outdent } from "outdent";
import { getRepositoryCommitHash, updateRepositories } from "./utilities.mjs";

const GITHUB_DOMAIN = "https://github.com/";

async function addProject() {
  const rl = new readline.Interface({
    input: process.stdin,
    output: process.stdout,
  });
  let input = await rl.question(
    outdent`
      Which repository are you going to add?
      Example:
        - prettier/prettier
        - https://github.com/prettier/prettier\n
    `,
  );

  // https://github.com/nodejs/node/issues/31762
  rl.terminal = false;
  rl.close();

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

  await updateRepositories(async (repositories) => {
    if (repositories.some((project) => project.repository === repository)) {
      throw new Error(`Repository '${repository}' already exists.`);
    }

    const commit = await getRepositoryCommitHash(repository);
    return [...repositories, { repository, commit }];
  });
}

await addProject();

console.log("done");
