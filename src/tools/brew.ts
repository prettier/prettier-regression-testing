import spawn from "nano-spawn";

export async function install(packageName: string): Promise<void> {
  await spawn("brew", ["install", packageName]);
}
