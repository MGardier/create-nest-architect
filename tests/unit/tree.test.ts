import assert from "assert";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { test } from "node:test";
import { VirtualTree } from "../../src/services/tree.service";

// =============================================================================
//                             IN-MEMORY API
// =============================================================================

test("write / read / exists / delete / paths", () => {
  const tree = new VirtualTree();

  tree.write("src/app.module.ts", "content");
  assert.strictEqual(tree.exists("src/app.module.ts"), true);
  assert.strictEqual(tree.read("src/app.module.ts"), "content");
  assert.deepStrictEqual(tree.paths(), ["src/app.module.ts"]);

  assert.strictEqual(tree.delete("src/app.module.ts"), true);
  assert.strictEqual(tree.exists("src/app.module.ts"), false);
  assert.strictEqual(tree.delete("src/app.module.ts"), false);
});

test("read throws a clear error on a missing path", () => {
  const tree = new VirtualTree();
  assert.throws(() => tree.read("missing.ts"), /File not found in tree: missing.ts/);
});

test("paths are normalized (leading ./ and backslashes)", () => {
  const tree = new VirtualTree();
  tree.write("./package.json", "{}");
  assert.strictEqual(tree.exists("package.json"), true);
  tree.write("src\\main.ts", "main");
  assert.strictEqual(tree.read("src/main.ts"), "main");
});

// =============================================================================
//                             FROM TEMPLATE DIR
// =============================================================================

test("fromTemplateDir loads files recursively and excludes .git", async () => {
  const fixtureDir = await mkdtemp(join(tmpdir(), "tree-fixture-"));
  try {
    await writeFile(join(fixtureDir, "package.json"), '{"name":"template"}');
    await mkdir(join(fixtureDir, "src"), { recursive: true });
    await writeFile(join(fixtureDir, "src", "main.ts"), "bootstrap();");
    await mkdir(join(fixtureDir, ".git"), { recursive: true });
    await writeFile(join(fixtureDir, ".git", "config"), "[core]");

    const tree = new VirtualTree();
    await tree.fromTemplateDir(fixtureDir);

    assert.deepStrictEqual(tree.paths().sort(), ["package.json", "src/main.ts"]);
    assert.strictEqual(tree.read("src/main.ts"), "bootstrap();");
  } finally {
    await rm(fixtureDir, { recursive: true, force: true });
  }
});

// =============================================================================
//                                 COMMIT
// =============================================================================

test("commit writes every file, creating nested directories", async () => {
  const targetRoot = await mkdtemp(join(tmpdir(), "tree-commit-"));
  const targetDir = join(targetRoot, "my-app");
  try {
    const tree = new VirtualTree();
    tree.write("package.json", '{"name":"my-app"}');
    tree.write("src/infrastructure/repositories/prisma/.config/schema.prisma", "datasource db {}");

    await tree.commit(targetDir);

    assert.strictEqual(await readFile(join(targetDir, "package.json"), "utf-8"), '{"name":"my-app"}');
    assert.strictEqual(
      await readFile(join(targetDir, "src/infrastructure/repositories/prisma/.config/schema.prisma"), "utf-8"),
      "datasource db {}"
    );
  } finally {
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("a failing commit cleans up what it wrote and throws a clear error", async () => {
  const targetRoot = await mkdtemp(join(tmpdir(), "tree-fail-"));
  const targetDir = join(targetRoot, "my-app");
  try {
    const tree = new VirtualTree();
    // "conflict" is written as a file first, then "conflict/child.ts"
    // needs it as a directory: mkdir fails mid-commit
    tree.write("conflict", "i am a file");
    tree.write("conflict/child.ts", "content");

    await assert.rejects(tree.commit(targetDir), /Failed to write the project to/);

    assert.strictEqual(existsSync(targetDir), false, "half-written project should be removed");
  } finally {
    await rm(targetRoot, { recursive: true, force: true });
  }
});

test("nothing exists on disk before commit", async () => {
  const targetRoot = await mkdtemp(join(tmpdir(), "tree-nocommit-"));
  const targetDir = join(targetRoot, "my-app");
  try {
    const tree = new VirtualTree();
    tree.write("package.json", "{}");
    assert.strictEqual(existsSync(targetDir), false);
  } finally {
    await rm(targetRoot, { recursive: true, force: true });
  }
});
