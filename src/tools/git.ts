import execa from "execa";

export function remoteAdd(
  remoteName: string,
  repositoryUrl: string,
  cwd: string
) {
  return execa("git", ["remote", "add", remoteName, repositoryUrl], { cwd });
}

export function fetch(remoteName: string, cwd: string) {
  return execa("git", ["fetch", remoteName], { cwd });
}

export function checkout(ref: string, cwd: string) {
  return execa("git", ["checkout", ref], { cwd });
}

export async function revParseHead(cwd: string) {
  const headCommitHash = await execa("git", ["rev-parse", "HEAD"], {
    cwd,
  }).then(({ stdout }) => stdout);
  return headCommitHash;
}

export async function remoteGetUrl(cwd: string) {
  const remoteUrl = await execa(
    "git",
    ["remote", "get-url", "--all", "origin"],
    { cwd }
  ).then(({ stdout }) => stdout);
  return remoteUrl;
}

export async function diffSubmodule(directoryPath: string, cwd: string) {
  const diffString = await execa("git", [
    "diff",
    "--submodule=diff",
    directoryPath,
  ]).then(({ stdout }) => stdout);
  return diffString;
}

export async function add(pathspec: string, cwd: string) {
  return execa("git", ["add", pathspec], { cwd });
}

export async function commitAllowEmptyNoVerify(message: string, cwd: string) {
  return execa(
    "git",
    ["commit", "--allow-empty", "--no-verify", "-m", JSON.stringify(message)],
    { cwd }
  );
}

export async function resetHeadHard(cwd: string) {
  return execa("git", ["reset", "head^", "--hard"], { cwd });
}
