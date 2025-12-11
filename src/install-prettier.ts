import path from "node:path";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import spawn from "nano-spawn";
import {
  PrettierVersion,
  PrettierPullRequest,
  PRETTIER_PACKAGE_TYPE_PULL_REQUEST,
} from "./parse-command.ts";

export type InstalledPrettier = Awaited<ReturnType<typeof installPrettier>>;

export async function installPrettiers({
  directory,
  alternative,
  original,
}: {
  directory: string;
  alternative: PrettierVersion;
  original: PrettierVersion;
}) {
  return {
    alternative: await installPrettier(
      path.join(directory, "alternative-prettier"),
      alternative,
    ),
    original: await installPrettier(
      path.join(directory, "original-prettier"),
      original,
    ),
  };
}

async function installPrettier(
  directory: string,
  prettierVersion: PrettierVersion,
) {
  const cwd = path.join(directory, "prettier");
  await fs.mkdir(cwd, { recursive: true });

  let version: string;
  if (prettierVersion.type === PRETTIER_PACKAGE_TYPE_PULL_REQUEST) {
    const pullRequestDirectory = path.join(directory, "pull-request");
    const filename = await checkoutPullRequest(
      pullRequestDirectory,
      prettierVersion.number,
    );
    await fs.rename(
      path.join(pullRequestDirectory, filename),
      path.join(cwd, filename),
    );
    version = `file:./${filename}`;
  } else {
    ({ version } = prettierVersion);
  }

  await spawn("yarn", ["init", "-y"], { cwd });
  await fs.writeFile(path.join(cwd, "yarn.lock"), "");
  await spawn("yarn", ["add", `prettier@${version}`], { cwd });

  const prettierBinary = path.join(
    cwd,
    "node_modules/prettier/bin/prettier.cjs",
  );
  await spawn(process.execPath, [prettierBinary, "--version"]);

  return {
    bin: prettierBinary,
    version: prettierVersion,
  };
}

async function isGhLogged() {
  try {
    const subprocess = await spawn("gh", ["auth", "status"]);
    console.log(subprocess);
    return !subprocess.stderr.includes("You are not logged into");
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function authGh() {
  try {
    spawn("gh", ["--version"]);
  } catch {
    await spawn("brew", ["install", "gh"]);
  }

  if (await isGhLogged()) {
    return;
  }

  const { NODE_AUTH_TOKEN } = process.env;

  if (!NODE_AUTH_TOKEN) {
    throw new Error(
      "Please run `gh auth login` to login or set `NODE_AUTH_TOKEN`.",
    );
  }

  await spawn("gh", ["auth", "login", "--with-token"], {
    stdin: {
      string: NODE_AUTH_TOKEN,
    },
  });

  assert.equal(await isGhLogged(), true);
}

async function checkoutPullRequest(
  directory: string,
  pullRequestNumber: PrettierPullRequest["number"],
) {
  await authGh();

  const cwd = directory;
  await fs.mkdir(cwd, { recursive: true });

  await spawn("git", ["init"], { cwd });
  await spawn(
    "git",
    ["remote", "add", "origin", "https://github.com/prettier/prettier.git"],
    { cwd },
  );
  await spawn("gh", ["pr", "checkout", pullRequestNumber], { cwd });

  const { stdout } = await spawn("npm", ["pack"], { cwd });
  const filename = stdout.trim();

  return filename;
}
