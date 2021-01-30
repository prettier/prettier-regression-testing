import fs from "fs/promises";
import path from "path";
import { Command, PrettierRepositorySource } from "../parse";
import { runPrettier } from "./run-prettier";
import {
  setupPullRequestNumber,
  setupRepositoryAndRef,
  setupVersion,
} from "./setup-repository";

const cwd = process.cwd();
const prettierRepositoryPath = path.join(cwd, "./prettier");
const targetRepositoriesPath = path.join(cwd, "./repos");

async function setupPrettierRepository(
  prettierRepositorySource: PrettierRepositorySource
) {
  switch (prettierRepositorySource.type) {
    case "prNumber": {
      setupPullRequestNumber(prettierRepositorySource, prettierRepositoryPath);
      break;
    }
    case "repositoryAndRef": {
      setupRepositoryAndRef(prettierRepositorySource, prettierRepositoryPath);
      break;
    }
    case "version": {
      setupVersion(prettierRepositorySource, prettierRepositoryPath);
      break;
    }
  }
}

//  リポジトリセットアップ手順
//    prNumber の場合
//      gh をインストールする
//      gh pr checkout prNumber する
//      yarn install
//    repositoryAndRef の場合
//      git remote add sosukesuzuki sosukesuzuki/prettier
//      git fetch sosukesuzuki
//      git checkout ref
//      yarn install
//    version の場合
//      git checkout tags/1.1.0 する
//      yarn install

export async function execute({
  alternativePrettier,
  originalPrettier,
}: Command) {
  //  original
  //    まず original を リポジトリセットアップ手順 に従ってセットアップする
  //    original を各 projects に対して実行する
  //    各プロジェクトで変更差分をコミット(コミットメッセージは"Changed by 何かしら識別できる情報")
  // Setup originalVersionPrettier
  await setupPrettierRepository(originalPrettier);

  const targetRepositoryNames = await fs.readdir(targetRepositoriesPath);

  await Promise.all(
    targetRepositoryNames.map(async (targetRepositoryName) => {
      await runPrettier(
        prettierRepositoryPath,
        targetRepositoriesPath,
        targetRepositoryName
      );
    })
  );
}
