import path from "node:path";
import {
  PrettierVersion,
  PrettierPullRequest,
  sourceTypes
} from "../parse.ts";
import * as configuration from "../configuration.ts";
import * as brew from "../tools/brew.ts";
import * as gh from "../tools/gh.ts";
import * as yarn from "../tools/yarn.ts";
import * as npm from "../tools/npm.ts";
import * as unix from "../tools/unix.ts";
import {createTemporaryDirectory, type TemporaryDirectory} from './create-temporary-directory.ts'

export type InstalledPrettier = Awaited<ReturnType<typeof installPrettier>>

export async function installPrettier(
  prettierVersion: PrettierVersion,
) {
  let version: string
  let pullRequestDirectory: TemporaryDirectory | undefined
  if (prettierVersion.type === sourceTypes.pullRequest) {
    ({version, directory: pullRequestDirectory} = await getPullRequest(prettierVersion.number) )
  } else {
    ({version} = prettierVersion)
  }

  
  const directory = await createTemporaryDirectory()
  const {path: cwd} = directory
  await yarn.init(['-y'], {cwd})
  await yarn.add([`prettier@${version}`],{cwd})

  await pullRequestDirectory?.dispatch()

  return {
    dispatch: () => {directory.dispatch()},
    bin: path.join(cwd, 'node_modules/prettier/bin/prettier.cjs'),
    name: prettierVersion.raw
  }
}

async function existsGh() {
  return !(await unix.which("gh")).includes("gh not found");
}

async function getPullRequest(
  pullRequestNumber: PrettierPullRequest['number'],
) {
  if (!(await existsGh())) {
    await brew.install("gh");
  }
  if (configuration.authToken !== "nothing") {
    // running locally, `gh` can be already authenticated
    await gh.authLoginWithToken(configuration.authToken);
  }

  const directory = await createTemporaryDirectory()

  await gh.prCheckout(pullRequestNumber, directory.path);
  const {stdout} = await npm.pack({cwd: directory.path});

  return {
    directory,
    version: `file:${path.join(directory.path, stdout.trim())}`
  };
}
