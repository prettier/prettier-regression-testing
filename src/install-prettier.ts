import path from "node:path";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import spawn from "nano-spawn";
import {
  type PrettierVersion,
  PRETTIER_PACKAGE_TYPE_PULL_REQUEST,
} from "./parse-command.ts";
import { writeFile, clearDirectory } from "./utilities.ts";
import { Timing } from "./timing.ts";

export type InstalledPrettier = Awaited<ReturnType<typeof installPrettier>>;

export async function installPrettier(
  version: PrettierVersion,
  { cwd }: { cwd: string },
) {
  const timing = new Timing(
    `Install Prettier[${version.kind}] '${version.raw}'`,
  );
  const directory = await clearDirectory(
    path.join(cwd, `${version.kind}-prettier`),
  );

  const packageToInstall = await getPrettierPackageName(version, {
    cwd: directory,
  });

  await spawn("yarn", ["init", "-y"], { cwd: directory });
  await writeFile(path.join(directory, "yarn.lock"), "");
  await spawn("yarn", ["add", packageToInstall], { cwd: directory });

  const prettierBinary = path.join(
    directory,
    "node_modules/prettier/bin/prettier.cjs",
  );

  const { stdout: installedVersion } = await spawn(process.execPath, [
    prettierBinary,
    "--version",
  ]);
  assert.ok(typeof installedVersion === "string");

  timing.end();

  return {
    bin: prettierBinary,
    version: version,
  };
}

async function isGhLogged() {
  const { stdout, stderr } = await spawn("gh", ["auth", "status"]);
  return (
    stdout.includes("Logged in to github.com") ||
    stderr.includes("Logged in to github.com")
  );
}

async function authGh() {
  try {
    spawn("gh", ["--version"]);
  } catch {
    await spawn("brew", ["install", "gh"]);
  }

  try {
    if (await isGhLogged()) {
      return;
    }
  } catch {
    // Noop
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
  pullRequestNumber: string,
  { cwd }: { cwd: string },
) {
  await authGh();

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

async function getPrettierPackageName(
  version: PrettierVersion,
  { cwd }: { cwd: string },
) {
  if (version.type !== PRETTIER_PACKAGE_TYPE_PULL_REQUEST) {
    return `prettier@${version.version}`;
  }

  const directory = await clearDirectory(
    path.join(cwd, `pull-request-${version.number}`),
  );
  const filename = await checkoutPullRequest(version.number, {
    cwd: directory,
  });
  await fs.rename(path.join(directory, filename), path.join(cwd, filename));

  return `prettier@file:./${filename}`;
}
