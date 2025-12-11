import spawn from "nano-spawn";
import path from "node:path";
import assert from "node:assert/strict";
import Ajv, { DefinedError } from "ajv";
import { repositoriesDirectory } from "./constants.ts";
import { clearDirectory } from "./utilities.ts";
import rawProjects from "../projects.json" with { type: "json" };

type RawProject = {
  repository: string;
  glob: string | readonly string[];
  ignoreFile?: string;
  ignore?: string | readonly string[];
  commit: string;
};

export type Project = {
  name: string;
  repository: string;
  glob: readonly string[];
  ignoreFile: string | undefined;
  ignore: readonly string[];
  commit: string;
  directoryName: string;
  directory: string;
};

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
  required: ["commit", "repository"],
  additionalProperties: false,
};

const schema = {
  type: "array",
  items: projectSchema,
} as const;

const ajv = new Ajv();

export const validateProjects = ajv.compile(schema);

let projects: Project[];
export function getProjects(): Project[] {
  if (projects) {
    return projects;
  }

  if (!validateProjects(rawProjects)) {
    throw validateProjects.errors![0] as DefinedError;
  }

  projects = (rawProjects as RawProject[]).map((rawProject) => {
    const name = getProjectName(rawProject);
    const directoryName = name.replaceAll("/", "__");

    return {
      name,
      repository: rawProject.repository,
      glob: Array.isArray(rawProject.glob)
        ? rawProject.glob
        : [rawProject.glob ?? "."],
      ignoreFile: rawProject.ignoreFile,
      ignore: Array.isArray(rawProject.ignore)
        ? rawProject.ignore
        : rawProject.glob
          ? [rawProject.glob]
          : [],
      commit: rawProject.commit,
      directoryName,
      directory: path.join(repositoriesDirectory, directoryName),
    };
  });

  return projects;
}

export const getProjectName = (project: RawProject): string =>
  new URL(project.repository).pathname.slice(1).replace(/\.git$/, "");

async function getCommitHash({ short, cwd }: { short?: boolean; cwd: string }) {
  try {
    const { stdout } = await spawn(
      "git",
      ["rev-parse", ...(short ? ["--short"] : []), "HEAD"],
      { cwd },
    );
    return stdout.trim();
  } catch {
    // No op
  }
}

export async function cloneProject(project: Project) {
  const cwd = project.directory;

  // If it's already on the correct commit
  if ((await getCommitHash({ cwd })) === project.commit) {
    return;
  }

  await clearDirectory(cwd);
  await spawn("git", ["init"], { cwd });
  await spawn(
    "git",
    ["fetch", "--depth=1", project.repository, project.commit],
    { cwd },
  );
  await spawn("git", ["checkout", project.commit], { cwd });

  assert.equal(await getCommitHash({ cwd }), project.commit);

  return;
}
