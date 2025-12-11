import { getRepositoryCommitHash, updatedRepositories } from "./utilities.mjs";

await updatedRepositories((repositories) =>
  Promise.all(
    repositories.map(async (repository) => ({
      ...repository,
      commit: await getRepositoryCommitHash(repository.repository),
    })),
  ),
);

console.log("done");
