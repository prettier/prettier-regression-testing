import * as git from "../tools/git";

/**
 * Returns head commit hash and repository name like "sosukesuzuki/prettier@foo"
 */
export async function getPrettyHeadCommitHash(
  repositoryPath: string,
): Promise<string> {
  const headCommitHash = await git.revParseHead(repositoryPath);
  const remoteUrl = await git.remoteGetUrl(repositoryPath);
  const projectUrl = remoteUrl.replace(".git", "");
  // like "sosukesuzuki/prettier"
  const prettyRepositoryName = projectUrl.replace("https://github.com/", "");
  return `[${prettyRepositoryName}@${headCommitHash}](${projectUrl}/tree/${headCommitHash})`;
}
