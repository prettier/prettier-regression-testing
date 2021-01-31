import execa from "execa";

export async function install(packageName: string): Promise<void> {
  await execa("brew", ["install", packageName]);
}
