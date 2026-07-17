import assert from "node:assert/strict";
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
  switch (repository.repository) {
    case "react/react": {
      await updateFile(path.join(directory, ".prettierrc.js"), (text) => {
        assert.ok(text.includes("'prettier-plugin-hermes-parser'"));
        assert.ok(text.includes("parser: 'hermes'"));

        text = text.replaceAll("'prettier-plugin-hermes-parser'", "");
        text = text.replaceAll("parser: 'hermes'", "parser: 'flow'");
        return text;
      });
      break;
    }

    case "facebook/stylex": {
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
      break;
    }

    case "gitlabhq/gitlabhq":
      await updateFile(path.join(directory, ".prettierrc"), (text) => {
        text = text.replace('"plugins": ["prettier-plugin-tailwindcss"],', "");
        text = text.replace(
          '"tailwindConfig": "./config/tailwind.config.js",',
          "",
        );
        return text;
      });
      break;
  }
}

export default setupRepository;
