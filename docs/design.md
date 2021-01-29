# Design

`run alternativeVersionPrettier vs originalVersionPrettier`

## `alternativeVersionPrettier`

Required.

There are 3 ways to specify.

### 1. Versions such as `2.0.0` and `1.7.1`.

This will be installed via `yarn add prettier@version`.

### 2. Forked repository name + ref(like branch names and commit hashes) such as `sosukesuzuki/prettier#ref`.

This will be installed via `yarn add prettier@sosukesuzuki/prettier#ref`.

### 3. Pull Request number on [prettier/prettier](https://github.com/prettier/prettier) repository such us `#110168`.

This will be installed via `gh pr checkout 110168`.

## `originalVersionPrettier`

Not required.

In default, `prettier/prettier` is specified.

Also, you can specify same as `alternativeVersionPrettier`
