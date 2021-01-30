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
