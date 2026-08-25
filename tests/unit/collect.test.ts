import assert from "assert";
import { test, TestContext } from "node:test";
import prompts from "prompts";
import {
  ARCHITECTURE_TYPE,
  DATABASE,
  PACKAGER_TYPE,
} from "../../src/config/choices";
import { collectConfig } from "../../src/config/questions";

/**
 * process.exit is stubbed so the abort paths can be observed in-process:
 * the stub throws ExitError instead of killing the test runner.
 */
class ExitError extends Error {
  constructor(readonly code: number | undefined) {
    super(`process.exit(${code})`);
  }
}

function stubExit(t: TestContext): void {
  t.mock.method(process, "exit", ((code?: number) => {
    throw new ExitError(code);
  }) as never);
}

function stubConsoleError(t: TestContext): string[] {
  const messages: string[] = [];
  t.mock.method(console, "error", (message: string) => {
    messages.push(String(message));
  });
  return messages;
}


// =============================================================================
//                             FULL FLOWS
// =============================================================================

test("collects a full SQL config (prisma auto-selected for mysql)", async () => {
  prompts.inject([
    "my-app",
    PACKAGER_TYPE.NPM,
    ARCHITECTURE_TYPE.FEATURED,
    DATABASE.MYSQL,
  ]);

  const config = await collectConfig();

  assert.strictEqual(config.packager.lockfile, "package-lock.json");
  assert.strictEqual(config.projectName, "my-app");
  assert.strictEqual(config.packagerType, PACKAGER_TYPE.NPM);
  assert.strictEqual(config.architectureType, ARCHITECTURE_TYPE.FEATURED);
  assert.strictEqual(config.database, DATABASE.MYSQL);
  assert.strictEqual(config.orm, "prisma");
});

test("collects a full NoSQL config (mongoose auto-selected for mongodb)", async () => {
  prompts.inject([
    "my-app",
    PACKAGER_TYPE.PNPM,
    ARCHITECTURE_TYPE.CLEAN,
    DATABASE.MONGODB,
  ]);

  const config = await collectConfig();

  assert.strictEqual(config.database, DATABASE.MONGODB);
  assert.strictEqual(config.orm, "mongoose");
  assert.strictEqual(config.packager.lockfile, "pnpm-lock.yaml");
});


// =============================================================================
//                  PRE-FILLED PARTIAL (argv / future flags)
// =============================================================================


test("skips the project name question when pre-filled from argv", async () => {
  prompts.inject([
    PACKAGER_TYPE.YARN,
    ARCHITECTURE_TYPE.FEATURED,
    DATABASE.MYSQL,
  ]);

  const config = await collectConfig({ projectName: "from-argv" });

  assert.strictEqual(config.projectName, "from-argv");
  assert.strictEqual(config.packagerType, PACKAGER_TYPE.YARN);
  assert.strictEqual(config.orm, "prisma");
});


// =============================================================================
//                            CANCELLATION
// =============================================================================

test("cancellation aborts with a clean message and no config", async (t) => {
  stubExit(t);
  const errors = stubConsoleError(t);

  prompts.inject([new Error("cancelled by user")]);

  await assert.rejects(collectConfig(), (err: unknown) => {
    assert.ok(err instanceof ExitError);
    assert.strictEqual(err.code, 1);
    return true;
  });

  assert.ok(
    errors.some((message) => message.includes("Aborted, nothing was created.")),
    `Expected abort message, got: ${errors.join(" | ")}`
  );
});



test("cancellation on a later question also aborts", async (t) => {
  stubExit(t);
  const errors = stubConsoleError(t);

  prompts.inject([
    "my-app",
    PACKAGER_TYPE.NPM,
    new Error("cancelled by user"),
  ]);

  await assert.rejects(collectConfig(), (err: unknown) => {
    assert.ok(err instanceof ExitError);
    assert.strictEqual(err.code, 1);
    return true;
  });

  assert.ok(errors.some((message) => message.includes("Aborted, nothing was created.")));
});

// =============================================================================
//                            VALIDATION
// =============================================================================

test("empty project name is rejected with the historical message", async (t) => {
  stubExit(t);
  const errors = stubConsoleError(t);

  prompts.inject([
    "",
    PACKAGER_TYPE.NPM,
    ARCHITECTURE_TYPE.FEATURED,
    DATABASE.MYSQL,
  ]);

  await assert.rejects(collectConfig(), (err: unknown) => {
    assert.ok(err instanceof ExitError);
    assert.strictEqual(err.code, 1);
    return true;
  });

  assert.ok(
    errors.some((message) => message.includes("You must specify a name to create project.")),
    `Expected historical validation message, got: ${errors.join(" | ")}`
  );
});

test("unknown orm pre-filled is rejected with the available list", async (t) => {
  stubExit(t);
  const errors = stubConsoleError(t);

  await assert.rejects(
    collectConfig({
      projectName: "my-app",
      packagerType: PACKAGER_TYPE.NPM,
      architectureType: ARCHITECTURE_TYPE.FEATURED,
      database: DATABASE.MYSQL,
      orm: "typeorm",
    }),
    (err: unknown) => {
      assert.ok(err instanceof ExitError);
      assert.strictEqual(err.code, 1);
      return true;
    }
  );

  assert.ok(
    errors.some((message) => message.includes('Unknown ORM "typeorm"') && message.includes("prisma, mongoose")),
    `Expected unknown-orm message listing available ids, got: ${errors.join(" | ")}`
  );
});

test("incompatible orm/database pair pre-filled is rejected with the compatible list", async (t) => {
  stubExit(t);
  const errors = stubConsoleError(t);

  await assert.rejects(
    collectConfig({
      projectName: "my-app",
      packagerType: PACKAGER_TYPE.NPM,
      architectureType: ARCHITECTURE_TYPE.FEATURED,
      database: DATABASE.MONGODB,
      orm: "prisma",
    }),
    (err: unknown) => {
      assert.ok(err instanceof ExitError);
      assert.strictEqual(err.code, 1);
      return true;
    }
  );

  assert.ok(
    errors.some((message) => message.includes("does not support") && message.includes("Compatible: mysql")),
    `Expected incompatibility message listing compatible databases, got: ${errors.join(" | ")}`
  );
});
