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
import * as unix from "../tools/unix";

export async function setupPrettierRepository(
  prettierRepositorySource: PrettierRepositorySource
): Promise<void> {
  switch (prettierRepositorySource.type) {
    case "prNumber": {
      await setupPullRequestNumber(
        prettierRepositorySource,
        configuration.prettierRepositoryPath
      );
      break;
    }
    case "repositoryAndRef": {
      await setupRepositoryAndRef(
        prettierRepositorySource,
        configuration.prettierRepositoryPath
      );
      break;
    }
    case "version": {
      await setupVersion(
        prettierRepositorySource,
        configuration.prettierRepositoryPath
      );
      break;
    }
  }
}

async function existsGh() {
  return !(await unix.which("gh")).includes("gh not found");
}
async function setupPullRequestNumber(
  repositorySource: PrettierRepositorySourcePrNumber,
  cwd: string
) {
  if (!(await existsGh())) {
    await brew.install("gh");
  }
  await gh.authLoginWithToken(configuration.authToken);
  await gh.prCheckout(repositorySource.prNumber, cwd);
  await yarn.install(cwd);
}

function getRepositoryUrlWithToken(repositoryName: string) {
  return `https://${configuration.authToken}@github.com/${repositoryName}.git`;
}
async function setupRepositoryAndRef(
  repositorySource: PrettierRepositorySourceRepositoryAndRef,
  cwd: string
) {
  const { repositoryName, ref } = repositorySource;
  const repositoryUrlWithToken = getRepositoryUrlWithToken(repositoryName);
  const uniq = "remote" + new Date().getTime();
  await git.remoteAdd(uniq, repositoryUrlWithToken, cwd);
  await git.fetch(uniq, cwd);
  await git.checkout(ref, cwd);
  await yarn.install(cwd);
}

async function setupVersion(
  repositorySource: PrettierRepositorySourceVersion,
  cwd: string
) {
  await git.checkout(`tags/${repositorySource.version}`, cwd);
  await yarn.install(cwd);
}
