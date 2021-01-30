import fs from "fs/promises";
import path from "path";
import { Command, PrettierRepositorySource } from "../parse";
import { getPrettyHeadCommitHash } from "./get-pretty-head-commit-hash";
import { runPrettier } from "./run-prettier";
import { setupPrettierRepository } from "./setup-repository";
import * as configuration from "../configuration";

const getTargetRepositoryPath = (targetRepositoryName: string) =>
  path.join(configuration.targetRepositoriesPath, targetRepositoryName);

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
  const targetRepositoryNames = await fs.readdir(
    configuration.targetRepositoriesPath
  );
  const prettierHeadCommitHashList = await Promise.all(
    targetRepositoryNames.map(async (targetRepositoryName) =>
      getPrettyHeadCommitHash(getTargetRepositoryPath(targetRepositoryName))
    )
  );
  //  original
  //    まず original を リポジトリセットアップ手順 に従ってセットアップする
  //    original を各 projects に対して実行する
  //    各プロジェクトで変更差分をコミット(コミットメッセージは"Changed by 何かしら識別できる情報")
  // Setup originalVersionPrettier
  await setupPrettierRepository(originalPrettier);
  await Promise.all(
    targetRepositoryNames.map(async (targetRepositoryName) => {
      await runPrettier(
        configuration.prettierRepositoryPath,
        getTargetRepositoryPath(targetRepositoryName),
        targetRepositoryName
      );
    })
  );
}
