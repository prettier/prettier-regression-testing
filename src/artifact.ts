import { DefaultArtifactClient } from "@actions/artifact";
import * as github from "@actions/github";
import * as path from "path";
import { writeFile } from "./utilities.ts";
import { type Repository } from "./repositories.ts";

export async function uploadToArtifact(
  reports: { repository: Repository; diff: string }[],
): Promise<string | undefined> {
  const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE!;

  const files = await Promise.all(
    reports.map(async ({ repository, diff }) => {
      const file = `${repository.directoryName}.path`;
      await writeFile(path.join(GITHUB_WORKSPACE, file), diff);
      return file;
    }),
  );

  const artifactClient = new DefaultArtifactClient();
  const artifactName = "Partial reports";
  const uploaded = await artifactClient.uploadArtifact(
    artifactName,
    files,
    GITHUB_WORKSPACE,
  );

  const url = `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/actions/runs/${github.context.runId}/artifacts/${uploaded.id}`;

  return url;
}
