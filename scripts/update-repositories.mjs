import { getRepositoryCommitHash, updateRepositories } from "./utilities.mjs";

await updateRepositories((repositories) =>
  Promise.all(
    repositories.map(async (repository) => ({
      ...repository,
      commit: await getRepositoryCommitHash(repository.repository),
    })),
  ),
);

console.log("done");
