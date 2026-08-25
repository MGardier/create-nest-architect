import assert from "assert";
import { existsSync } from "fs";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { test } from "node:test";
import {
  ARCHITECTURE_TYPE,
  DATABASE,
  PACKAGER_TYPE,
} from "../../src/config/choices";
import { ConfigChoice } from "../../src/config/config.types";
import { PackagerFactory } from "../../src/constants/packager.constants";
import { runPipeline } from "../../src/pipeline";
import type { PostStep, Step } from "../../src/steps/step.types";

function makeConfig(): ConfigChoice {
  return {
    projectName: "my-app",
    packagerType: PACKAGER_TYPE.NPM,
    architectureType: ARCHITECTURE_TYPE.FEATURED,
    database: DATABASE.MYSQL,
    orm: "prisma",
    packager: PackagerFactory.getCommands(PACKAGER_TYPE.NPM),
  };
}

/** Runs `fn` with cwd moved to a fresh temp workspace. */
async function inTempWorkspace(fn: (workspace: string) => Promise<void>): Promise<void> {
  const workspace = await mkdtemp(join(tmpdir(), "pipeline-test-"));
  const previousCwd = process.cwd();
  process.chdir(workspace);
  try {
    await fn(workspace);
  } finally {
    process.chdir(previousCwd);
    await rm(workspace, { recursive: true, force: true });
  }
}

test("golden rule: a step that throws before commit leaves nothing on disk", async () => {
  await inTempWorkspace(async (workspace) => {
    const writeStep: Step = {
      name: "write",
      run: async (tree) => { tree.write("package.json", "{}"); },
    };
    const failingStep: Step = {
      name: "boom",
      run: async () => { throw new Error("boom"); },
    };

    await assert.rejects(
      runPipeline(makeConfig(), { steps: [writeStep, failingStep], postSteps: [] }),
      /boom/
    );

    assert.strictEqual(existsSync(join(workspace, "my-app")), false);
  });
});

test("postSteps run after the commit and see the files on disk", async () => {
  await inTempWorkspace(async (workspace) => {
    const writeStep: Step = {
      name: "write",
      run: async (tree) => {
        tree.write("package.json", '{"name":"my-app"}');
        return "from-tree-step";
      },
    };

    let fileOnDiskDuringPostStep = false;
    const postStep: PostStep = {
      name: "post",
      run: async () => {
        fileOnDiskDuringPostStep = existsSync(join(workspace, "my-app", "package.json"));
        return "from-post-step";
      },
    };

    const messages = await runPipeline(makeConfig(), { steps: [writeStep], postSteps: [postStep] });

    assert.strictEqual(fileOnDiskDuringPostStep, true);
    assert.deepStrictEqual(messages, ["from-tree-step", "from-post-step"]);
  });
});

test("a step skipped by `when` never runs", async () => {
  await inTempWorkspace(async () => {
    let ran = false;
    const skipped: Step = {
      name: "skipped",
      when: () => false,
      run: async () => { ran = true; },
    };

    await runPipeline(makeConfig(), { steps: [skipped], postSteps: [] });

    assert.strictEqual(ran, false);
  });
});
