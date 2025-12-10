import spawn, {type Options} from "nano-spawn";

export async function install(cwd: string): Promise<void> {
  await spawn("yarn", [], { cwd });
}

export async function init(args: string [] ,options: Options): Promise<void> {
  await spawn("yarn", ['init',...args], options);
}

export async function add(args: string [] ,options: Options): Promise<void> {
  await spawn("yarn", ['add',...args], options);
}
