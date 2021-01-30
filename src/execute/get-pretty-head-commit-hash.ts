import * as git from "../tools/git";

/**
 * Returns head commit hash and repository name like "sosukesuzuki/prettier@foo"
 */
export async function getPrettyHeadCommitHash(repositoryPath: string) {
  const headCommitHash = await git.revParseHead(repositoryPath);
  const remoteUrl = await git.remoteGetUrl(repositoryPath);
  // like "sosukesuzuki/prettier"
  const prettyRepositoryName = remoteUrl
    .replace("https://github.com/", "")
    .replace(".git", "");
  return `${prettyRepositoryName}@${headCommitHash}`;
}
