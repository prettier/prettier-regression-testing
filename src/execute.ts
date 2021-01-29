import path from "path";
import { Command } from "./parse";

//  リポジトリセットアップ手順
//    prNumber の場合
//      yarn add prettier する
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
  const cwd = process.cwd();
  //  original
  //    まず original を リポジトリセットアップ手順 に従ってセットアップする
  //    original を各 projects に対して実行する
  //    各プロジェクトで変更差分をコミット(コミットメッセージは"Changed by 何かしら識別できる情報")
  //
}
