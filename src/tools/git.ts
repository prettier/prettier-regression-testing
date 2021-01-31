import execa from "execa";

export async function remoteAdd(
  remoteName: string,
  repositoryUrl: string,
  cwd: string
): Promise<void> {
  await execa("git", ["remote", "add", remoteName, repositoryUrl], { cwd });
}

export async function fetch(remoteName: string, cwd: string): Promise<void> {
  await execa("git", ["fetch", remoteName], { cwd });
}

export async function checkout(ref: string, cwd: string): Promise<void> {
  await execa("git", ["checkout", ref], { cwd });
}

export async function revParseHead(cwd: string): Promise<string> {
  const headCommitHash = await execa("git", ["rev-parse", "HEAD"], {
    cwd,
  }).then(({ stdout }) => stdout);
  return headCommitHash;
}

export async function remoteGetUrl(cwd: string): Promise<string> {
  const remoteUrl = await execa(
    "git",
    ["remote", "get-url", "--all", "origin"],
    { cwd }
  ).then(({ stdout }) => stdout);
  return remoteUrl;
}

export async function diffSubmodule(
  directoryPath: string,
  cwd: string
): Promise<string> {
  const diffString = await execa(
    "git",
    ["diff", "--submodule=diff", directoryPath],
    { cwd }
  ).then(({ stdout }) => stdout);
  return diffString;
}

export async function add(pathspec: string, cwd: string): Promise<void> {
  await execa("git", ["add", pathspec], { cwd });
}

export async function commitAllowEmptyNoVerify(
  message: string,
  cwd: string
): Promise<void> {
  await execa(
    "git",
    ["commit", "--allow-empty", "--no-verify", "-m", JSON.stringify(message)],
    { cwd }
  );
}

export async function resetHeadHard(cwd: string): Promise<void> {
  await execa("git", ["reset", "head^", "--hard"], { cwd });
}
