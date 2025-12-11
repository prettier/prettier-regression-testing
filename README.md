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
RUN alternative_version
RUN alternative_version VS original_version
RUN alternative_version ON repositories
RUN alternative_version VS original_version ON repositories
```

`RUN`, `VS`, `ON` directives are case-insensitive.

### `alternative_version`

Required.

There are 2 ways to specify.

1. Versions or repository name + ref (e.g. `2.0.0`, `1.7.1`, or `sosukesuzuki/prettier#2f3fc241f8cb1867a0a3073ceac9d662e4b25fab`), it's installed directly with `yarn add`, so anything that [`yarn add`](https://yarnpkg.com/cli/add) allows
2. Pull Request number on [prettier/prettier](https://github.com/prettier/prettier) repository (e.g. `#110168`).

```
RUN #110168
RUN sosukesuzuki/prettier#fix-foo
```

### `original_version`

Optional.

Uses `prettier/prettier` by default, same syntax as `original_version`


```
RUN #110168 VS sosukesuzuki/prettier#fix-foo
RUN sosukesuzuki/prettier#fix-foo VS 1.0.0
```


### `repositories`

Optional.

Run [all repositories](./projects.json) by default.

Comma separated repository list. (Currently only allow repositories defined in `projects.json`)

```
RUN #110168 ON https://github.com/babel/babel.git
RUN #110168 ON https://github.com/babel/babel.git,https://github.com/prettier/prettier.git
RUN #110168 VS 1.0.0 ON https://github.com/babel/babel.git,https://github.com/prettier/prettier.git
```


## Add new project

Add a project info to `projects.json`.
