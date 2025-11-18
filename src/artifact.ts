import * as artifact from "@actions/artifact";
import * as github from "@actions/github";
import * as path from "path";
import * as fs from "fs";
import { getOctokit } from "./octokit.ts";

export async function uploadToArtifact(
  texts: string[],
): Promise<string | undefined> {
  if (texts.length === 0) {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE!;

  const filePaths = texts.map((text) => ({
    filePath: path.join(GITHUB_WORKSPACE, Date.now().toString() + ".txt"),
    text,
  }));

  for (const { filePath, text } of filePaths) {
    fs.writeFileSync(filePath, text, "utf-8");
  }

  const artifactClient = new artifact.DefaultArtifactClient();
  const artifactName = "artifact" + Date.now().toString();

  await artifactClient.uploadArtifact(
    artifactName,
    filePaths.map(({ filePath }) => filePath),
    GITHUB_WORKSPACE,
  );

  const octokit = getOctokit();
  const {
    data: { artifacts },
  } = await octokit.actions.listWorkflowRunArtifacts({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    run_id: github.context.runId,
  });

  const artifactData = artifacts.find((a) => a.name === artifactName);

  return artifactData?.url;
}
