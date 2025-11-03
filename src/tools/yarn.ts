import spawn from "nano-spawn";

export async function install(cwd: string): Promise<void> {
  await spawn("yarn", [], { cwd });
}
