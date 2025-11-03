import spawn from "nano-spawn";

export async function which(cmd: string): Promise<string> {
  const res = await spawn("which", [cmd]).then(({ stdout }) => stdout);
  return res;
}
