import path from "path";
import { existsSync, promises as fs } from "fs";
import Ajv, { DefinedError } from "ajv";
import * as logger from "./logger";
import * as configuration from "./configuration";
import * as git from "./tools/git";

export interface Project {
  repository: string;
  glob: string | readonly string[];
  ignoreFile?: string;
  ignore?: string | readonly string[];
  commit: string;
}

const projectSchema = {
  type: "object",
  properties: {
    repository: { type: "string" },
    commit: { type: "string" },
    glob: {
      oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
    },
    ignoreFile: { type: "string" },
    ignore: {
      oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
    },
  },
  required: ["commit", "glob", "repository"],
  additionalProperties: false,
};

const schema = {
  type: "array",
  items: projectSchema,
} as const;

const ajv = new Ajv();

export const validateProjects = ajv.compile(schema);

let data: Project[];

export async function getProjects(): Promise<Project[]> {
  if (data) {
    return data;
  }
  const projectJsonPath = path.join(__dirname, "..", "projects.json");
  data = JSON.parse(await fs.readFile(projectJsonPath, "utf-8"));
  if (validateProjects(data)) {
    return data as Project[];
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  throw validateProjects.errors![0] as DefinedError;
}

export const getProjectName = (project: Project): string =>
  new URL(project.repository).pathname.slice(1).replace(/\.git$/, "");

export async function cloneProjects(): Promise<void> {
  await logger.log("Cloning repositories...");
  const projects = await getProjects();
  await Promise.all(
    projects.map(async (project) => {
      const directoryName = getProjectName(project);
      const directory = path.join(
        configuration.targetRepositoriesPath,
        directoryName,
      );
      const parentDirectory = path.join(directory, "../");
      if (!existsSync(parentDirectory)) {
        await fs.mkdir(parentDirectory, { recursive: true });
      }
      if (!existsSync(directory)) {
        await git.shallowClone(project.repository, project.commit, directory);
      }
    }),
  );
}
