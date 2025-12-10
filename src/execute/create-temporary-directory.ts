import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

export async function createTemporaryDirectory() {
  const directory = path.join(
    // The following quoted from https://github.com/es-tooling/module-replacements/blob/27d1acd38f19741e31d2eae561a5c8a914373fc5/docs/modules/tempy.md?plain=1#L20-L21, not sure if it's true
    // MacOS and possibly some other platforms return a symlink from `os.tmpdir`.
    // For some applications, this can cause problems; thus, we use `realpath`.
    await fs.realpath(os.tmpdir()),
    crypto.randomBytes(16).toString("hex"),
  );

  fs.mkdir(directory);

  return {
    path: directory,
    dispatch: () => destroyTemporaryDirectory(directory),
  };
}

async function destroyTemporaryDirectory(directory: string) {
  await fs.rm(directory, { recursive: true, force: true });
}

export type TemporaryDirectory = Awaited<
  ReturnType<typeof createTemporaryDirectory>
>;
