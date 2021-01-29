import fs from "fs/promises";
import path from "path";
import execa from "execa";

const defaultOriginal = "prettier/prettier";
const defaultTargets = [
  "https://github.com/prettier/prettier",
  "https://github.com/vuejs/eslint-plugin-vue",
  "https://github.com/babel/babel",
  "https://github.com/excalidraw/excalidraw",
];

const WORKSPACE = path.join(process.cwd(), "workspace");
const fileExists = (file) =>
  fs.stat(file).then(
    () => true,
    () => false
  );

function parseInput() {
  const pieces = process.argv.slice(2);
  const alternative = pieces[0];
  const secondText = pieces[1] || "";

  if (secondText.toLowerCase() !== "vs") {
    pieces.splice(1, 0, "vs", "");
  }

  const original = pieces[2] || defaultOriginal;
  let targets = [];

  if (pieces.length > 4 && pieces[3].toLowerCase() === "on") {
    targets = pieces.slice(4);
  }

  if (targets.length === 0) {
    targets = defaultTargets;
  }

  return { original, alternative, targets };
}

function runYarn(command, yarnArgument, cwd) {
  const subprocess = execa("yarn", [command, yarnArgument], { cwd });
  subprocess.stdout.pipe(process.stdout);
  return subprocess;
}

function runGit(command, gitArguments, cwd) {
  return execa(
    "git",
    [command, ...(Array.isArray(gitArguments) ? gitArguments : [gitArguments])],
    { cwd }
  );
}

function runPrettier(prettier, cwd) {
  const subprocess = execa(
    "node",
    [prettier, ".", "--ignore-unknown", "--write"],
    { cwd }
  );
  subprocess.stdout.pipe(process.stdout);
  return subprocess;
}

async function installPrettier(type, version) {
  const directory = path.join(WORKSPACE, type);
  await fs.mkdir(directory, { recursive: true });
  await runYarn("init", "-y", directory);
  await runYarn("add", `prettier@${version}`, directory);

  for (const binFile of ["bin/prettier.js", "bin-prettier.js"]) {
    const prettierPath = path.join(
      directory,
      `node_modules/prettier/${binFile}`
    );

    if (await fileExists(prettierPath)) {
      return prettierPath;
    }
  }

  throw new Error(`Can not find bin file on "prettier@${version}".`);
}

async function getDifference({
  target,
  originalPrettier,
  alternativePrettier,
}) {
  const directory = path.join(
    WORKSPACE,
    target.split("/").filter(Boolean).pop()
  );
  if (!(await fileExists(directory)))
    await runGit(
      "clone",
      [target, "--single-branch", "--depth", "1", directory],
      WORKSPACE
    );
  await runPrettier(originalPrettier, directory);

  await runGit("commit", ["-am", "Format with original version.", "--allow-empty"], directory);

  await runPrettier(alternativePrettier, directory);
  const f = path.join(directory, "selectpage.js");
  await fs.writeFile(f, (await fs.readFile(f, "utf8")).replace(/a/g, "A"));
  const { stdout } = await runGit("diff", [], directory);
  return stdout;
}

const { original, alternative, targets } = parseInput();
const originalPrettier = await installPrettier("original", original);
const alternativePrettier = await installPrettier("alternative", alternative);

const differences = [];
for (const target of targets) {
  differences.push({
    target,
    differences: await getDifference({
      target,
      originalPrettier,
      alternativePrettier,
    }),
  });
}

const reportFile = path.join(WORKSPACE, "report.json");
await fs.writeFile(
  reportFile,
  JSON.stringify(
    {
      original,
      alternative,
      targets,
      differences,
    },
    undefined,
    2
  )
);
