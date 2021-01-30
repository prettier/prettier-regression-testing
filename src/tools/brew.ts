import execa from "execa";

export function install(packageName: string) {
  return execa("brew", ["install", packageName]);
}
