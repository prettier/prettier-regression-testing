import execa from "execa";

export async function install(cwd: string): Promise<void> {
  await execa("yarn", [], { cwd });
}
