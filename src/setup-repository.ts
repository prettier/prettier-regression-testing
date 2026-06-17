import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";
import { type Repository } from "./repositories.ts";

async function updateFile(
  file: string,
  process: (text: string) => Promise<string> | string,
) {
  let text = await fs.readFile(file, "utf8");
  text = await process(text);
  await fs.writeFile(file, text);
}

async function setupRepository(directory: string, repository: Repository) {
  if (
    repository.repository === "facebook/relay" ||
    repository.repository === "react/metro"
  ) {
    await updateFile(path.join(directory, ".prettierrc.js"), (text) => {
      text = text.replace("plugins,", "");
      text = text.replaceAll("parser: 'hermes'", "parser: 'flow'");
      return text;
    });
  } else if (repository.repository === "facebook/stylex") {
    await updateFile(path.join(directory, "package.json"), (text) => {
      const packageJson = JSON.parse(text);
      const { prettier } = packageJson;

      assert.ok(Array.isArray(prettier.plugins));
      delete packageJson.prettier.plugins;

      assert.ok(Array.isArray(prettier.overrides));
      for (const { options } of prettier.overrides) {
        if (options.parser === "hermes") {
          options.parser = "flow";
        }
      }

      return JSON.stringify(packageJson, undefined, 2);
    });
  }
}

export default setupRepository;
