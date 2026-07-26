import assert from "assert";
import { spawn } from "child_process";
import { readFile, stat } from "fs/promises";
import { join } from "path";

/********************** FILESYSTEM ASSERTIONS  ******************************** */

async function pathExists(absolutePath: string): Promise<boolean> {
  try {
    await stat(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export async function assertPathExists(projectDir: string, relativePath: string): Promise<void> {
  assert.ok(
    await pathExists(join(projectDir, relativePath)),
    `Expected path to exist: ${relativePath}`
  );
}

export async function assertPathMissing(projectDir: string, relativePath: string): Promise<void> {
  assert.ok(
    !(await pathExists(join(projectDir, relativePath))),
    `Expected path to be absent: ${relativePath}`
  );
}

export async function assertFileContains(
  projectDir: string,
  relativePath: string,
  expected: string
): Promise<void> {
  const content = await readFile(join(projectDir, relativePath), "utf-8");
  assert.ok(
    content.includes(expected),
    `Expected ${relativePath} to contain: ${expected}`
  );
}

export async function assertFileNotMatches(
  projectDir: string,
  relativePath: string,
  pattern: RegExp
): Promise<void> {
  const content = await readFile(join(projectDir, relativePath), "utf-8");
  assert.ok(
    !pattern.test(content),
    `Expected ${relativePath} not to match: ${pattern}`
  );
}

/********************** PACKAGE JSON ASSERTIONS  ******************************** */

export async function readProjectPackageJson(
  projectDir: string
): Promise<Record<string, any>> {
  return JSON.parse(await readFile(join(projectDir, "package.json"), "utf-8"));
}

export function assertDependencies(
  packageJson: Record<string, any>,
  names: string[]
): void {
  const all = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  for (const name of names) {
    assert.ok(all[name], `Expected dependency "${name}" in generated package.json`);
  }
}

/********************** PROJECT BUILD  ******************************** */

export async function runProjectBuild(
  projectDir: string,
  timeoutMs: number
): Promise<{ exitCode: number | null; output: string }> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("npm", ["run", "build"], {
      cwd: projectDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      rejectPromise(
        new Error(`Project build timed out after ${timeoutMs}ms.\nOutput:\n${output}`)
      );
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (output += chunk.toString()));

    child.on("error", (err) => {
      clearTimeout(timer);
      rejectPromise(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({ exitCode: code, output });
    });
  });
}
