import fs from "fs/promises";
import path from "path";
import { getProjects, validateProjects } from "../src/projects";

describe("getProjects", () => {
  it("gets projects from json file", async () => {
    const projects = await getProjects();
    const projectsJsonPath = path.join(__dirname, "..", "projects.json");
    const data = JSON.parse(await fs.readFile(projectsJsonPath, "utf-8"));
    expect(projects).toEqual(data);
  });

  it("doesn't throw for correct project", () => {
    const projects = [
      {
        repository: "http://example.com",
        commit: "foo",
        glob: "foo",
      },
    ];
    expect(validateProjects(projects)).toBe(true);
  });

  it("throws error for project that does not have require property", () => {
    const projects = {
      foo: {
        commit: "foo",
      },
    };
    expect(validateProjects(projects)).toBe(false);
  });
});
