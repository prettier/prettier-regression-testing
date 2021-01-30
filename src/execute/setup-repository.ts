import {
  PrettierRepositorySourceVersion,
  PrettierRepositorySourcePrNumber,
  PrettierRepositorySourceRepositoryAndRef,
  PrettierRepositorySource,
} from "../parse";
import * as configuration from "../configuration";
import * as brew from "../tools/brew";
import * as gh from "../tools/gh";
import * as git from "../tools/git";
import * as yarn from "../tools/yarn";

export async function setupPrettierRepository(
  prettierRepositorySource: PrettierRepositorySource
) {
  switch (prettierRepositorySource.type) {
    case "prNumber": {
      setupPullRequestNumber(
        prettierRepositorySource,
        configuration.prettierRepositoryPath
      );
      break;
    }
    case "repositoryAndRef": {
      setupRepositoryAndRef(
        prettierRepositorySource,
        configuration.prettierRepositoryPath
      );
      break;
    }
    case "version": {
      setupVersion(
        prettierRepositorySource,
        configuration.prettierRepositoryPath
      );
      break;
    }
  }
}

async function setupPullRequestNumber(
  repositortSource: PrettierRepositorySourcePrNumber,
  cwd: string
) {
  await brew.install("gh");
  await gh.authLoginWithToken(process.env.NODE_AUTH_TOKEN);
  await gh.prCheckout(repositortSource.prNumber, cwd);
  await yarn.install(cwd);
}

function getRepositoryUrlWithToken(repositoryName: string, token: string) {
  return `https://${token}@github.com/${repositoryName}.git`;
}
async function setupRepositoryAndRef(
  repositortSource: PrettierRepositorySourceRepositoryAndRef,
  cwd: string
) {
  const { remoteName, repositoryName, ref } = repositortSource;
  const repositoryUrlWithToken = getRepositoryUrlWithToken(
    repositoryName,
    process.env.NODE_AUTH_TOKEN
  );
  await git.remoteAdd(remoteName, repositoryUrlWithToken, cwd);
  await git.fetch(remoteName, cwd);
  await git.checkout(ref, cwd);
  await yarn.install(cwd);
}

async function setupVersion(
  repositortSource: PrettierRepositorySourceVersion,
  cwd: string
) {
  await git.checkout(`tags/${repositortSource.version}`, cwd);
  await yarn.install(cwd);
}
