# prettier-regression-testing

## Motivation

https://github.com/prettier/prettier/issues/9290

We run Prettier on other projects prior to release to check for regressions. (See [Release Checklist](https://github.com/prettier/prettier/wiki/Release-Checklist))

We used to do that manually.

- https://github.com/sosukesuzuki/eslint-plugin-vue/pull/1
- https://github.com/sosukesuzuki/typescript-eslint/pull/1

This is a lot of work, so we use GitHub Actions to automate it.

## Usage

Create an issue comment like the one below:

```
run alternativeVersionPrettier vs originalVersionPrettier
```

### `alternativeVersionPrettier`

Required.

There are 3 ways to specify.

1. Versions (e.g. `2.0.0`, `1.7.1`)
2. Repository name + ref (e.g. `sosukesuzuki/prettier#2f3fc241f8cb1867a0a3073ceac9d662e4b25fab`).
3. Pull Request number on [prettier/prettier](https://github.com/prettier/prettier) repository (e.g. `#110168`).

### `originalVersionPrettier`

Optional.

In default, use `prettier/prettier#main`.

Also, you can specify with the logic same as `alternativeVersionPrettier`.

## Examples

```
run #110168
```

```
run #110168 vs sosukesuzuki/prettier#main
```

```
run sosukesuzuki/prettier#main vs 1.8.1
```

## Add new project

Add a project info to `projects` object in `./src/projects.ts`.
