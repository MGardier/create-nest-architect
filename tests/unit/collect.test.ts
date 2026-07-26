import assert from "assert";
import { test, TestContext } from "node:test";
import prompts from "prompts";
import { ConfigChoice } from "../../src/classes/configChoice.class";
import {
  ARCHITECTURE_TYPE,
  DB_LANGUAGE,
  ODM_TYPE,
  ORM_TYPE,
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

test("collects a full SQL config (ORM question asked)", async () => {
  prompts.inject([
    "my-app",
    PACKAGER_TYPE.NPM,
    ARCHITECTURE_TYPE.FEATURED,
    DB_LANGUAGE.SQL,
    ORM_TYPE.PRISMA,
  ]);

  const config = await collectConfig();

  assert.ok(config instanceof ConfigChoice);
  assert.strictEqual(config.projectName, "my-app");
  assert.strictEqual(config.packagerType, PACKAGER_TYPE.NPM);
  assert.strictEqual(config.architectureType, ARCHITECTURE_TYPE.FEATURED);
  assert.strictEqual(config.dbLanguage, DB_LANGUAGE.SQL);
  assert.strictEqual(config.ormOrOdm, ORM_TYPE.PRISMA);
});

test("collects a full NoSQL config (ODM question asked)", async () => {
  prompts.inject([
    "my-app",
    PACKAGER_TYPE.PNPM,
    ARCHITECTURE_TYPE.CLEAN,
    DB_LANGUAGE.NOSQL,
    ODM_TYPE.MONGOOSE,
  ]);

  const config = await collectConfig();

  assert.strictEqual(config.dbLanguage, DB_LANGUAGE.NOSQL);
  assert.strictEqual(config.ormOrOdm, ODM_TYPE.MONGOOSE);
});


// =============================================================================
//                  PRE-FILLED PARTIAL (argv / future flags)
// =============================================================================


test("skips the project name question when pre-filled from argv", async () => {
  prompts.inject([
    PACKAGER_TYPE.YARN,
    ARCHITECTURE_TYPE.FEATURED,
    DB_LANGUAGE.SQL,
    ORM_TYPE.PRISMA,
  ]);

  const config = await collectConfig({ projectName: "from-argv" });

  assert.strictEqual(config.projectName, "from-argv");
  assert.strictEqual(config.packagerType, PACKAGER_TYPE.YARN);
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
//                            CANCELLATION
// =============================================================================

test("empty project name is rejected with the historical message", async (t) => {
  stubExit(t);
  const errors = stubConsoleError(t);

  prompts.inject([
    "",
    PACKAGER_TYPE.NPM,
    ARCHITECTURE_TYPE.FEATURED,
    DB_LANGUAGE.SQL,
    ORM_TYPE.PRISMA,
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
