import execa from "execa";

export function install(cwd: string) {
  return execa("yarn", ["install"], { cwd });
}
