import { DefaultArtifactClient } from "@actions/artifact";
import * as github from "@actions/github";
import * as path from "path";
import { getOctokit } from "./octokit.ts";
import { writeFile } from "./utilities.ts";

export async function uploadToArtifact(
  texts: string[],
): Promise<string | undefined> {
  if (texts.length === 0) {
    return undefined;
  }

  const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE!;

  const files = await Promise.all(
    texts.map(async (text) => {
      const file = Date.now().toString() + ".diff";

      await writeFile(path.join(GITHUB_WORKSPACE, file), text);

      return file;
    }),
  );

  const artifactClient = new DefaultArtifactClient();
  const artifactName = "reports-" + Date.now().toString();
  await artifactClient.uploadArtifact(artifactName, files, GITHUB_WORKSPACE);

  const octokit = getOctokit();
  const {
    data: { artifacts },
  } = await octokit.rest.actions.listWorkflowRunArtifacts({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    run_id: github.context.runId,
  });
  console.log(artifacts);

  const artifactData = artifacts.find((a) => a.name === artifactName);
  console.log(artifactData);

  return artifactData!.archive_download_url;
}
