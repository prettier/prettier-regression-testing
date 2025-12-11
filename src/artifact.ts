import { DefaultArtifactClient } from "@actions/artifact";
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

  const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE!;

  const filePaths = texts.map((text) => ({
    file: Date.now().toString() + ".txt",
    text,
  }));

  for (const { file, text } of filePaths) {
    fs.writeFileSync(path.join(GITHUB_WORKSPACE, file), text, "utf-8");
  }

  const artifactClient = new DefaultArtifactClient();
  const artifactName = "reports" + Date.now().toString();

  await artifactClient.uploadArtifact(
    artifactName,
    filePaths.map(({ file }) => file),
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
