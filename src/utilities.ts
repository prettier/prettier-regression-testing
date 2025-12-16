import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import spawn, { SubprocessError } from "nano-spawn";
import { outdent } from "outdent";
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

export async function removeFilesCannotAdd(cwd: string, files: string[] = []) {
  try {
    await spawn("git", ["add", "."], { cwd });
  } catch (error) {
    if (error instanceof SubprocessError) {
      const { stderr } = error;
      const match = stderr.match(
        /error: open\("(?<filename>.*)"\): Filename too long/,
      );
      const filename = match?.groups?.filename;
      if (filename) {
        console.log(`File '${filename}' can't be added, ignored.`);
        files.push(filename);
        await fs.rm(path.join(cwd, filename), { force: true });
        return removeFilesCannotAdd(cwd, files);
      }
    }

    throw error;
  }

  return files;
}

export const commitChanges = async (directory: string, message: string) => {
  await fs.rm(path.join(directory, ".gitattributes"), { force: true });
  await spawn("git", ["config", "set", "core.autocrlf", "false"], {
    cwd: directory,
  });

  await spawn("git", ["add", "."], { cwd: directory });

  await spawn(
    "git",
    ["commit", "--allow-empty", "--no-verify", "-m", message],
    { cwd: directory },
  );

  return getCommitHash(directory);
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

export function printMarkdownCodeBlock(content: string, syntax?: string) {
  const backtickSequences = content.match(/`+/g) || [];
  const longestBacktickSequenceLength = Math.max(
    ...backtickSequences.map(({ length }) => length),
  );
  const fenceLength = Math.max(3, longestBacktickSequenceLength + 1);
  const fence = "`".repeat(fenceLength);
  return [fence + (syntax || ""), content, fence].join("\n");
}

export function printMarkdownDetails(summary: string, body: string) {
  /*
  Note: do not indent the code block, otherwise the diff render incorrectly in comments.
  ``````md
  ```diff
    - this is not removal
  - this is removal
  ```

  and

    ```diff
    - this is not removal
  - this is removal
  ```

  are different
  ``````
  */
  return outdent`
    <details>
      <summary>${summary}</summary>

    ${body}

    </details>
  `;
}
