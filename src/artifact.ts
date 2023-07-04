import * as artifact from "@actions/artifact";
import * as github from "@actions/github";
import * as path from "path";
import * as fs from "fs";
import { getOctokit } from "./octokit";

export async function uploadToArtifact(
  texts: string[],
): Promise<string | undefined> {
  if (texts.length === 0) {
    return undefined;
  }
  const filePaths = texts.map((text) => ({
    filePath: path.join(
      process.env.GITHUB_WORKSPACE!,
      Date.now().toString() + ".txt",
    ),
    text,
  }));

  for (const { filePath, text } of filePaths) {
    fs.writeFileSync(filePath, text, "utf-8");
  }

  const artifactClient = artifact.create();
  const artifactName = "artifact" + Date.now().toString();

  await artifactClient.uploadArtifact(
    artifactName,
    filePaths.map(({ filePath }) => filePath),
    process.env.GITHUB_WORKSPACE!,
    {
      continueOnError: true,
    },
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
