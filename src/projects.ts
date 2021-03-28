import path from "path";
import * as configuration from "./configuration";
import * as git from "./tools/git";

export interface Project {
  url: string;
  glob: string;
  ignore?: string;
  commit: string;
}

/* eslint sort-keys: "error" */
export const projects: { [key: string]: Project } = {
  babel: {
    commit: "2ae19d01b132f5222e1d5bee2c83921e2f107d70",
    glob: "./{packages,codemods,eslint}/**/*.js",
    ignore: ".eslintignore",
    url: "https://github.com/babel/babel.git",
  },
  "eslint-plugin-vue": {
    commit: "62f577dcfcb859c24c6e0d4615ad880f5e1d4688",
    glob: "./**/*.js",
    url: "https://github.com/vuejs/eslint-plugin-vue.git",
  },
  excalidraw: {
    commit: "25fd27515866b5704066d9301dd641c481f6c38c",
    glob: "./**/*.{css,scss,json,md,html,yml,ts,tsx,js}",
    ignore: ".eslintignore",
    url: "https://github.com/excalidraw/excalidraw.git",
  },
  prettier: {
    commit: "5f8bad8275a589ec903bddeacd484123c7db54ab",
    glob: ".",
    url: "https://github.com/prettier/prettier.git",
  },
  "typescript-eslint": {
    commit: "d0d71862efd7e079694fa9513ea983cc908ec6f6",
    glob: "./**/*.{ts,js,json,md}",
    url: "https://github.com/typescript-eslint/typescript-eslint.git",
  },
  "vega-lite": {
    commit: "2dff36f971d76292ef3747fc3568e53bf747ef51",
    glob: "./**/*.ts",
    ignore: ".eslintignore",
    url: "https://github.com/vega/vega-lite.git",
  },
} as const;
/* eslint-disable sort-keys */

export async function setupProjects(): Promise<void> {
  await Promise.all(
    Object.entries(projects).map(async ([name, project]) => {
      await git.clone(project.url, configuration.cwd);
      await git.checkout(project.commit, path.join(configuration.cwd, name));
    })
  );
}
