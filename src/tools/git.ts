import spawn from "nano-spawn";
import path from "path";
import fs from "fs/promises";

export async function remoteAdd(
  remoteName: string,
  repositoryUrl: string,
  cwd: string,
): Promise<void> {
  await spawn("git", ["remote", "add", remoteName, repositoryUrl], { cwd });
  await spawn("git", ["config", "checkout.defaultRemote", remoteName], { cwd });
}

export async function fetch(remoteName: string, cwd: string): Promise<void> {
  await spawn("git", ["fetch", remoteName], { cwd });
}

export async function fetchDepth1(
  remoteName: string,
  commitHash: string,
  cwd: string,
): Promise<void> {
  await spawn("git", ["fetch", "--depth", "1", remoteName, commitHash], {
    cwd,
  });
}

export async function checkout(ref: string, cwd: string): Promise<void> {
  await spawn("git", ["checkout", ref], { cwd });
}

export async function revParseHead(cwd: string): Promise<string> {
  const headCommitHash = await spawn("git", ["rev-parse", "HEAD"], {
    cwd,
  }).then(({ stdout }) => stdout);
  return headCommitHash;
}

export async function remoteGetUrl(cwd: string): Promise<string> {
  const remoteUrl = await spawn(
    "git",
    ["remote", "get-url", "--all", "origin"],
    { cwd },
  ).then(({ stdout }) => stdout);
  return remoteUrl;
}

export async function diffRepository(directoryPath: string): Promise<string> {
  const diffString = await spawn(
    "git",
    [
      "diff",
      `--src-prefix=ORI/${path.basename(directoryPath)}/`,
      `--dst-prefix=ALT/${path.basename(directoryPath)}/`,
    ],
    { cwd: directoryPath },
  ).then(({ stdout }) => stdout);
  return diffString;
}

export async function add(pathspec: string, cwd: string): Promise<void> {
  await spawn("git", ["add", pathspec], { cwd });
}

export async function commitAllowEmptyNoVerify(
  message: string,
  cwd: string,
): Promise<void> {
  await spawn(
    "git",
    ["commit", "--allow-empty", "--no-verify", "-m", JSON.stringify(message)],
    { cwd },
  );
}

export async function resetHeadHard(cwd: string): Promise<void> {
  await spawn("git", ["reset", "HEAD^", "--hard"], { cwd });
}

export async function clone(
  url: string,
  dirname: string,
  cwd: string,
): Promise<void> {
  await spawn("git", ["clone", url, dirname], { cwd });
}

export async function init(cwd: string): Promise<void> {
  await spawn("git", ["init"], { cwd });
}

export async function shallowClone(
  url: string,
  commit: string,
  cwd: string,
): Promise<void> {
  await fs.mkdir(cwd);
  await init(cwd);
  await remoteAdd("origin", url, cwd);
  await fetchDepth1("origin", commit, cwd);
  await checkout("FETCH_HEAD", cwd);
}
