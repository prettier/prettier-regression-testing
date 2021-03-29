import path from "path";
import { existsSync, promises as fs } from "fs";
import * as logger from "./logger";
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

async function shallowClone(project: Project, cwd: string) {
  await fs.mkdir(cwd);
  await git.init(cwd);
  await git.remoteAdd("origin", project.url, cwd);
  await git.fetchDepth1("origin", project.commit, cwd);
  await git.checkout("FETCH_HEAD", cwd);
}

export async function cloneProjects(): Promise<void> {
  await logger.log("Cloning repositories...");
  if (!existsSync(configuration.targetRepositoriesPath)) {
    await fs.mkdir(configuration.targetRepositoriesPath);
  }
  await Promise.all(
    Object.entries(projects).map(async ([name, project]) => {
      const repo = path.join(configuration.targetRepositoriesPath, name);
      if (!existsSync(repo)) {
        await shallowClone(project, repo);
      }
    })
  );
}
