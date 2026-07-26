import assert from "assert";
import { rm } from "fs/promises";
import { test } from "node:test";
import { createWorkspace, KEYS, PromptAnswer, runCli } from "./helpers/cli-runner";
import {
  assertDependencies,
  assertFileContains,
  assertFileNotMatches,
  assertPathExists,
  assertPathMissing,
  readProjectPackageJson,
  runProjectBuild,
} from "./helpers/project-assert";

/********************** CONSTANTS  ******************************** */

const COMBO_TIMEOUT_MS = 10 * 60_000;
const BUILD_TIMEOUT_MS = 5 * 60_000;

const PROMPT = {
  PACKAGER: "Which package manager would you like to use?",
  ARCHITECTURE: "Choose your project architecture:",
  DB_LANGUAGE: "Select the database type for your project:",
  ORM: "Which ORM would you like to set up?",
  ODM: "Which ODM would you like to set up?",
};

type Architecture = "FEATURED" | "CLEAN";
type DbLanguage = "SQL" | "NOSQL";

interface Combo {
  name: string;
  architecture: Architecture;
  dbLanguage: DbLanguage;
  checks: (projectDir: string) => Promise<void>;
}

/********************** PROMPT ANSWERS  ******************************** */

/**
 * Choice order in the CLI (see src/utils/choice.util.ts):
 *   packager      -> [npm, pnpm, yarn, bun]   (npm = first)
 *   architecture  -> [featured, clean]
 *   db language   -> [sql, nosql]
 *   orm / odm     -> single choice (prisma / mongoose)
 */
function answersFor(architecture: Architecture, dbLanguage: DbLanguage): PromptAnswer[] {
  return [
    { waitFor: PROMPT.PACKAGER, keys: KEYS.ENTER },
    {
      waitFor: PROMPT.ARCHITECTURE,
      keys: architecture === "FEATURED" ? KEYS.ENTER : KEYS.DOWN + KEYS.ENTER,
    },
    {
      waitFor: PROMPT.DB_LANGUAGE,
      keys: dbLanguage === "SQL" ? KEYS.ENTER : KEYS.DOWN + KEYS.ENTER,
    },
    { waitFor: dbLanguage === "SQL" ? PROMPT.ORM : PROMPT.ODM, keys: KEYS.ENTER },
  ];
}

/********************** COMMON CHECKS  ******************************** */

async function checkCommon(projectDir: string, projectName: string, combo: Combo): Promise<void> {
  const packageJson = await readProjectPackageJson(projectDir);
  assert.strictEqual(packageJson.name, projectName, "package.json name should be the project name");

  await assertPathMissing(projectDir, ".git");
  await assertPathExists(projectDir, "node_modules");
  await assertPathExists(projectDir, "package-lock.json");

  assertDependencies(packageJson, ["@nestjs/config"]);
  await assertFileContains(projectDir, ".env.example", "DATABASE_URL=");

  if (combo.architecture === "FEATURED") {
    await assertFileContains(projectDir, "src/app.module.ts", "import { ConfigModule } from '@nestjs/config'");
    await assertFileContains(projectDir, "src/app.module.ts", "ConfigModule.forRoot({isGlobal: true,})");
  }
}

async function checkBuild(projectDir: string): Promise<void> {
  const build = await runProjectBuild(projectDir, BUILD_TIMEOUT_MS);
  assert.strictEqual(build.exitCode, 0, `Generated project build failed:\n${build.output}`);

  // nest build emits dist/main.js, or dist/src/main.js when a root-level
  // .ts file (prisma.config.ts) widens the inferred rootDir
  const mainCandidates = ["dist/main.js", "dist/src/main.js"];
  const results = await Promise.allSettled(
    mainCandidates.map((candidate) => assertPathExists(projectDir, candidate))
  );
  assert.ok(
    results.some((result) => result.status === "fulfilled"),
    `Expected one of ${mainCandidates.join(", ")} after build`
  );
}

/********************** PER-COMBO CHECKS  ******************************** */

async function checkFeaturedPrisma(projectDir: string): Promise<void> {
  assertDependencies(await readProjectPackageJson(projectDir), ["prisma", "@prisma/client"]);

  await assertPathExists(projectDir, "prisma/schema.prisma");
  await assertPathExists(projectDir, "prisma/prisma.module.ts");
  await assertPathExists(projectDir, "prisma/prisma.service.ts");
  await assertPathExists(projectDir, "prisma.config.ts");
  await assertFileNotMatches(projectDir, "prisma/schema.prisma", /^\s*output\s*=/m);

  await assertFileContains(projectDir, "src/app.module.ts", "import { PrismaModule } from 'prisma/prisma.module'");
  await assertFileContains(projectDir, "src/app.module.ts", "PrismaModule,");
}

async function checkFeaturedMongoose(projectDir: string): Promise<void> {
  assertDependencies(await readProjectPackageJson(projectDir), ["@nestjs/mongoose", "mongoose"]);

  await assertPathExists(projectDir, "src/product/entities/product.entity.ts");
  await assertFileContains(
    projectDir,
    "src/product/product.module.ts",
    "MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])"
  );
  await assertFileContains(projectDir, "src/app.module.ts", "MongooseModule.forRoot(process.env.DATABASE_URL");
}

async function checkCleanPrisma(projectDir: string): Promise<void> {
  assertDependencies(await readProjectPackageJson(projectDir), ["prisma", "@prisma/client"]);

  const prismaConfigDir = "src/infrastructure/repositories/prisma/.config";
  await assertPathExists(projectDir, `${prismaConfigDir}/schema.prisma`);
  await assertPathExists(projectDir, `${prismaConfigDir}/prisma.module.ts`);
  await assertPathExists(projectDir, `${prismaConfigDir}/prisma.service.ts`);
  await assertPathMissing(projectDir, "prisma");

  await assertPathExists(projectDir, "prisma.config.ts");
  await assertFileContains(projectDir, "prisma.config.ts", `schema: '${prismaConfigDir}/schema.prisma'`);
  await assertFileNotMatches(projectDir, `${prismaConfigDir}/schema.prisma`, /^\s*output\s*=/m);

  await assertFileContains(
    projectDir,
    "src/app.module.ts",
    "import { PrismaModule } from './infrastructure/repositories/prisma/.config/prisma.module'"
  );
  await assertFileContains(projectDir, "src/app.module.ts", "PrismaModule,");
}

async function checkCleanMongoose(projectDir: string): Promise<void> {
  assertDependencies(await readProjectPackageJson(projectDir), ["@nestjs/mongoose", "mongoose"]);

  const mongooseDir = "src/infrastructure/repositories/mongoose";
  await assertPathExists(projectDir, `${mongooseDir}/mongoose.module.ts`);
  await assertPathExists(projectDir, `${mongooseDir}/schemas/product.entity.ts`);

  await assertFileContains(
    projectDir,
    "src/app.module.ts",
    "import { MongooseModule } from './infrastructure/repositories/mongoose/mongoose.module'"
  );
  await assertFileContains(projectDir, "src/app.module.ts", "MongooseModule,");
}

/********************** TEST MATRIX  ******************************** */

const COMBOS: Combo[] = [
  { name: "featured-prisma", architecture: "FEATURED", dbLanguage: "SQL", checks: checkFeaturedPrisma },
  { name: "featured-mongoose", architecture: "FEATURED", dbLanguage: "NOSQL", checks: checkFeaturedMongoose },
  { name: "clean-prisma", architecture: "CLEAN", dbLanguage: "SQL", checks: checkCleanPrisma },
  { name: "clean-mongoose", architecture: "CLEAN", dbLanguage: "NOSQL", checks: checkCleanMongoose },
];

// E2E_FILTER=<substring> runs a subset of combos, e.g. E2E_FILTER=mongoose
const filter = process.env.E2E_FILTER;

for (const combo of COMBOS) {
  test(
    `scaffold ${combo.name}`,
    { skip: filter && !combo.name.includes(filter) ? `filtered out by E2E_FILTER=${filter}` : false },
    async () => {
      const projectName = `e2e-${combo.name}`;
      const workspaceDir = await createWorkspace();

      try {
        const result = await runCli(
          workspaceDir,
          projectName,
          answersFor(combo.architecture, combo.dbLanguage),
          COMBO_TIMEOUT_MS
        );
        assert.strictEqual(result.exitCode, 0, `CLI exited with code ${result.exitCode}.\nOutput:\n${result.output}`);
        await checkCommon(result.projectDir, projectName, combo);
        await combo.checks(result.projectDir);
        await checkBuild(result.projectDir);
      } catch (err) {
        const reason = err instanceof Error ? err.message.split("\n")[0] : String(err);
        console.error(`[${combo.name}] failed — ${reason} (details in the test report, temporary project removed)`);
        throw err;
      } finally {
        await rm(workspaceDir, { recursive: true, force: true });
      }
    }
  );
}
