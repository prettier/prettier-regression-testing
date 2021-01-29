import path from "path";
import { Command, PrettierRepositorySource } from "./parse";

const cwd = process.cwd();
const prettierRepositoryPath = path.join(cwd, "./prettier");

async function setupPrettierRepository(
  prettierRepositorySource: PrettierRepositorySource
) {
  switch (prettierRepositorySource.type) {
    case "prNumber": {
    }
    case "repositoryAndRef": {
    }
    case "version": {
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

export function execute(command: Command) {
  //  original
  //    まず original を リポジトリセットアップ手順 に従ってセットアップする
  //    original を各 projects に対して実行する
  //    各プロジェクトで変更差分をコミット(コミットメッセージは"Changed by 何かしら識別できる情報")
  //
}
