import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { temporaryDirectory } from "./constants.ts";
import spawn from "nano-spawn";
import assert from "node:assert/strict";

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

export const commitChanges = async (directory: string, message: string) => {
  await spawn("git", ["add", "."], { cwd: directory });
  const { stdout } = await spawn(
    "git",
    ["commit", "--allow-empty", "--no-verify", "-m", message],
    { cwd: directory },
  );

  const match = stdout.match(/^\[(?<commitHash>[a-f0-9]{40}) [a-f0-9]{8}] /);
  if (!match?.groups!.commitHash) {
    throw new Error(`Unexpected commit hash '${stdout}'`);
  }

  const commitHash = match.groups.commitHash;
  return commitHash;
};

export async function getCommitHash(directory: string) {
  const { stdout } = await spawn("git", ["rev-parse", "HEAD"], {
    cwd: directory,
  });
  return stdout.trim();
}

export async function resetToCommitHash(directory: string, commitHash: string) {
  await spawn("git", ["reset", commitHash, "--hard"], { cwd: directory });
  assert.equal(await getCommitHash(directory), commitHash);
}

export function codeBlock(content: string, syntax?: string) {
  const backtickSequences = content.match(/`+/g) || [];
  const longestBacktickSequenceLength = Math.max(
    ...backtickSequences.map(({ length }) => length),
  );
  const fenceLength = Math.max(3, longestBacktickSequenceLength + 1);
  const fence = "`".repeat(fenceLength);
  return [fence + (syntax || ""), content, fence].join("\n");
}
