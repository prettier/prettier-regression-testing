import path from "path";
import { existsSync, promises as fs } from "fs";
import Ajv, { DefinedError } from "ajv";
import * as logger from "./logger";
import * as configuration from "./configuration";
import * as git from "./tools/git";

export interface Project {
  url: string;
  glob: string | readonly string[];
  ignore?: string;
  commit: string;
}

const projectSchema = {
  type: "object",
  properties: {
    commit: { type: "string" },
    glob: {
      oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
    },
    ignore: { type: "string" },
    url: { type: "string" },
  },
  required: ["commit", "glob", "url"],
  additionalProperties: false,
};

const schema = {
  type: "object",
  patternProperties: {
    ".+": projectSchema,
  },
  additionalProperties: false,
} as const;

const ajv = new Ajv();

export const validateProjects = ajv.compile(schema);

let data: { [project: string]: Project };

export async function getProjects(): Promise<{ [project: string]: Project }> {
  if (data) {
    return data;
  }
  const projectJsonPath = path.join(__dirname, "..", "projects.json");
  data = JSON.parse(await fs.readFile(projectJsonPath, "utf-8"));
  if (validateProjects(data)) {
    return data as { [project: string]: Project };
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  throw validateProjects.errors![0] as DefinedError;
}

export async function cloneProjects(): Promise<void> {
  await logger.log("Cloning repositories...");
  if (!existsSync(configuration.targetRepositoriesPath)) {
    await fs.mkdir(configuration.targetRepositoriesPath);
  }
  const projects = await getProjects();
  await Promise.all(
    Object.entries(projects).map(async ([name, project]) => {
      const repo = path.join(configuration.targetRepositoriesPath, name);
      if (!existsSync(repo)) {
        await git.shallowClone(project.url, project.commit, repo);
      }
    })
  );
}
