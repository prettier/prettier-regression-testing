import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { temporaryDirectory } from "./constants.ts";

export async function createTemporaryDirectory() {
  const directory =
    temporaryDirectory ??
    path.join(
      // The following quoted from https://github.com/es-tooling/module-replacements/blob/27d1acd38f19741e31d2eae561a5c8a914373fc5/docs/modules/tempy.md?plain=1#L20-L21, not sure if it's true
      // MacOS and possibly some other platforms return a symlink from `os.tmpdir`.
      // For some applications, this can cause problems; thus, we use `realpath`.
      await fs.realpath(os.tmpdir()),
      crypto.randomBytes(16).toString("hex"),
    );

  return clearDirectory(directory);
}

export async function clearDirectory(directory: string) {
  await fs.rm(directory, { recursive: true, force: true });
  await fs.mkdir(directory, { recursive: true });
  return directory;
}

export async function writeFile(file: string, content: string) {
  const directory = path.dirname(file);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(file, content);
}

export async function readFile(file: string) {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return "";
  }
}

export const unique = <T>(array: T[]): T[] => [...new Set(array)];
