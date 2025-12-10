import spawn, { type Subprocess, type Options } from "nano-spawn";

export async function pack(options: Options): Promise<Subprocess> {
  return await spawn("npm", ["pack"], options);
}
