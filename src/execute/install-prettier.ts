import path from "node:path";
import fs from "node:fs";
import assert from "node:assert/strict";
import { PrettierVersion, PrettierPullRequest, sourceTypes } from "../parse.ts";
import * as configuration from "../configuration.ts";
import * as brew from "../tools/brew.ts";
import * as gh from "../tools/gh.ts";
import * as yarn from "../tools/yarn.ts";
import * as npm from "../tools/npm.ts";
import * as unix from "../tools/unix.ts";
import * as git from "../tools/git.ts";
import {
  createTemporaryDirectory,
  type TemporaryDirectory,
} from "./create-temporary-directory.ts";

export type InstalledPrettier = Awaited<ReturnType<typeof installPrettier>>;

export async function installPrettier(prettierVersion: PrettierVersion) {
  let version: string;
  let pullRequestDirectory: TemporaryDirectory | undefined;
  if (prettierVersion.type === sourceTypes.pullRequest) {
    ({ version, directory: pullRequestDirectory } = await getPullRequest(
      prettierVersion.number,
    ));
  } else {
    ({ version } = prettierVersion);
  }

  const directory = await createTemporaryDirectory();
  const { path: cwd } = directory;
  await yarn.init(["-y"], { cwd });
  await yarn.add([`prettier@${version}`], { cwd });

  await pullRequestDirectory?.dispatch();

  const prettierBinary = path.join(
    cwd,
    "node_modules/prettier/bin/prettier.cjs",
  );
  assert.equal(fs.existsSync(prettierBinary), true);

  return {
    dispatch: () => {
      directory.dispatch();
    },
    bin: prettierBinary,
  };
}

async function existsGh() {
  return !(await unix.which("gh")).includes("gh not found");
}

async function getPullRequest(
  pullRequestNumber: PrettierPullRequest["number"],
) {
  if (!(await existsGh())) {
    await brew.install("gh");
  }
  if (configuration.authToken !== "nothing") {
    // running locally, `gh` can be already authenticated
    await gh.authLoginWithToken(configuration.authToken);
  }

  const directory = await createTemporaryDirectory();

  const cwd = directory.path;
  await git.init(cwd);
  await git.runGit(
    ["remote", "add", "origin", "https://github.com/prettier/prettier.git"],
    { cwd },
  );

  await gh.prCheckout(pullRequestNumber, cwd);
  const { stdout } = await npm.pack({ cwd });

  return {
    directory,
    version: `file:${path.join(cwd, stdout.trim())}`,
  };
}
