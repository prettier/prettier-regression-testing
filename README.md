# prettier-regression-testing

Automates the [prettier/prettier](https://github.com/prettier/prettier) regression checks with GitHub Actions.

## Context

https://github.com/prettier/prettier/issues/9290

We run Prettier on other projects prior to release to check for regressions. (See [Release Checklist](https://github.com/prettier/prettier/wiki/Release-Checklist))

We used to do that manually.

- https://github.com/sosukesuzuki/eslint-plugin-vue/pull/1
- https://github.com/sosukesuzuki/typescript-eslint/pull/1

This is a lot of work, so we use GitHub Actions to automate it.

## Usage

- Create a comment `run` on any issue.
  - Or `run with cheking out foo` to specify checking out.
- An issue comment that includes diffs will be created. (See [an issue for demo](https://github.com/sosukesuzuki/prettier-regression-testing/issues/6).)
