import execa from "execa";
import path from "path";

const targetRepositoryGlobPatternMap: Map<string, string> = new Map([
  ["typescript-eslint", "./**/*.{ts,js,json,md}"],
  ["eslint-plugin-vue", "./**/*.js"],
  ["babel", "./{packages,codemods,eslint}/**/*.js"],
  ["excalidraw", "./**/*.{css,scss,json,md,html,yml,ts,tsx,js}"],
  ["prettier", "."],
  ["vega-lite", "./**/*.ts"],
]);
const targetRepositoryIgnorePathMap: Map<string, string> = new Map([
  ["excalidraw", ".eslintignore"],
  ["babel", ".eslintignore"],
  ["vega-lite", ".eslintignore"],
]);

export async function runPrettier(
  prettierRepositoryPath: string,
  targetRepositoryPath: string,
  targetRepositoryName: string
): Promise<void> {
  const globPattern = targetRepositoryGlobPatternMap.get(targetRepositoryName);
  const ignorePath = targetRepositoryIgnorePathMap.get(targetRepositoryName);

  const prettierRepositoryBinPath = path.join(
    prettierRepositoryPath,
    "./bin/prettier.js"
  );

  const prettierArgs = ["--write"];
  prettierArgs.push(JSON.stringify(globPattern));
  if (ignorePath) {
    prettierArgs.push("--ignore-path", ignorePath);
  }
  await execa(prettierRepositoryBinPath, prettierArgs, {
    cwd: targetRepositoryPath,
    shell: true,
  });
}
