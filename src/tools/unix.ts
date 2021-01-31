import execa from "execa";

export async function which(cmd: string): Promise<string> {
  const res = await execa("which", [cmd]).then(({ stdout }) => stdout);
  return res;
}
