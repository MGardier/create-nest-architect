import assert from "assert";
import { test } from "node:test";
import {
  ARCHITECTURE_TYPE,
  DATABASE,
  PACKAGER_TYPE,
} from "../../src/config/choices";
import { ConfigChoice } from "../../src/config/config.types";
import { PackagerFactory } from "../../src/constants/packager.constants";
import { VirtualTree } from "../../src/services/tree.service";
import { mongooseInstaller } from "../../src/steps/orm/mongoose.installer";
import { prismaInstaller } from "../../src/steps/orm/prisma.installer";

/**
 * Installers are tested against an in-memory tree seeded like the
 * cloned templates (marker comments included): no disk, no mocks —
 * we just inspect the Map afterwards.
 */

const FEATURED_APP_MODULE = `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true,}),
    // Import necessary modules here (ormModules, etc.)
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
`;

const CLEAN_APP_MODULE = `import { Module } from '@nestjs/common';
// Infrastructure (Concrete implementation - adapters, ormModules, etc.)

@Module({
  imports: [
    // Import necessary modules here (ormModules, etc.)
  ],
})
export class AppModule {}
`;

const PRODUCT_MODULE = `import { Module } from '@nestjs/common';

@Module({
  imports: [
    // Import necessary modules here (ormModules, etc.)
  ],
})
export class ProductModule {}
`;

function makeTree(architecture: ARCHITECTURE_TYPE): VirtualTree {
  const tree = new VirtualTree();
  tree.write("package.json", '{"name": "template"}');
  tree.write(".env.example", "PORT=3000\n");
  tree.write(
    "src/app.module.ts",
    architecture === ARCHITECTURE_TYPE.CLEAN ? CLEAN_APP_MODULE : FEATURED_APP_MODULE
  );
  if (architecture === ARCHITECTURE_TYPE.FEATURED) {
    tree.write("src/product/product.module.ts", PRODUCT_MODULE);
  }
  return tree;
}

function makeConfig(overrides: Partial<ConfigChoice> = {}): ConfigChoice {
  return {
    projectName: "my-app",
    packagerType: PACKAGER_TYPE.NPM,
    architectureType: ARCHITECTURE_TYPE.FEATURED,
    database: DATABASE.MYSQL,
    orm: "prisma",
    packager: PackagerFactory.getCommands(PACKAGER_TYPE.NPM),
    ...overrides,
  };
}

// =============================================================================
//                                 PRISMA
// =============================================================================

test("prisma featured: schema, module, service, config and app.module in the tree", async () => {
  const tree = makeTree(ARCHITECTURE_TYPE.FEATURED);
  const message = await prismaInstaller.run(tree, makeConfig());

  const schema = tree.read("prisma/schema.prisma");
  assert.ok(schema.includes('provider = "mysql"'), "schema should use the mysql provider");
  assert.ok(!schema.includes("__PROVIDER__"), "provider placeholder should be replaced");

  assert.ok(tree.exists("prisma/prisma.module.ts"));
  assert.ok(tree.exists("prisma/prisma.service.ts"));
  assert.ok(tree.exists("prisma.config.ts"));

  const appModule = tree.read("src/app.module.ts");
  assert.ok(appModule.includes("import { PrismaModule } from 'prisma/prisma.module'"));
  assert.ok(appModule.includes("PrismaModule,"));

  assert.ok(tree.read(".env.example").includes('DATABASE_URL="mysql://'));
  assert.ok(message.includes("prisma migrate dev"));
});

test("prisma clean: files under the infrastructure config dir, schema path in prisma.config", async () => {
  const tree = makeTree(ARCHITECTURE_TYPE.CLEAN);
  await prismaInstaller.run(tree, makeConfig({ architectureType: ARCHITECTURE_TYPE.CLEAN }));

  const prismaDir = "src/infrastructure/repositories/prisma/.config";
  assert.ok(tree.exists(`${prismaDir}/schema.prisma`));
  assert.ok(tree.exists(`${prismaDir}/prisma.module.ts`));
  assert.ok(tree.exists(`${prismaDir}/prisma.service.ts`));
  assert.ok(!tree.exists("prisma/schema.prisma"), "nothing should land in a root prisma/ dir");

  assert.ok(tree.read("prisma.config.ts").includes(`schema: '${prismaDir}/schema.prisma'`));

  const appModule = tree.read("src/app.module.ts");
  assert.ok(appModule.includes("import { PrismaModule } from './infrastructure/repositories/prisma/.config/prisma.module'"));
  assert.ok(appModule.includes("PrismaModule,"));
});

// =============================================================================
//                                MONGOOSE
// =============================================================================

test("mongoose featured: entity, product.module and app.module in the tree", async () => {
  const tree = makeTree(ARCHITECTURE_TYPE.FEATURED);
  const config = makeConfig({ database: DATABASE.MONGODB, orm: "mongoose" });
  await mongooseInstaller.run(tree, config);

  assert.ok(tree.exists("src/product/entities/product.entity.ts"));

  const productModule = tree.read("src/product/product.module.ts");
  assert.ok(productModule.includes("MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])"));

  const appModule = tree.read("src/app.module.ts");
  assert.ok(appModule.includes("MongooseModule.forRoot(process.env.DATABASE_URL"));

  assert.ok(tree.read(".env.example").includes('DATABASE_URL="mongodb://'));
});

test("mongoose clean: module and entity under the infrastructure dir, app.module updated", async () => {
  const tree = makeTree(ARCHITECTURE_TYPE.CLEAN);
  const config = makeConfig({
    architectureType: ARCHITECTURE_TYPE.CLEAN,
    database: DATABASE.MONGODB,
    orm: "mongoose",
  });
  await mongooseInstaller.run(tree, config);

  const mongooseDir = "src/infrastructure/repositories/mongoose";
  assert.ok(tree.exists(`${mongooseDir}/mongoose.module.ts`));
  assert.ok(tree.exists(`${mongooseDir}/schemas/product.entity.ts`));

  const appModule = tree.read("src/app.module.ts");
  assert.ok(appModule.includes("import { MongooseModule } from './infrastructure/repositories/mongoose/mongoose.module'"));
  assert.ok(appModule.includes("MongooseModule,"));
});

// =============================================================================
//                              COMMON BEHAVIOR
// =============================================================================

test(".env.example is left untouched when DATABASE_URL already exists", async () => {
  const tree = makeTree(ARCHITECTURE_TYPE.FEATURED);
  tree.write(".env.example", 'DATABASE_URL="already-set"\n');

  await prismaInstaller.run(tree, makeConfig());

  assert.strictEqual(tree.read(".env.example"), 'DATABASE_URL="already-set"\n');
});

test("installers declare the packages for the post-commit install step", () => {
  assert.deepStrictEqual(prismaInstaller.dependencies, ["prisma", "@prisma/client"]);
  assert.deepStrictEqual(mongooseInstaller.dependencies, ["@nestjs/mongoose", "mongoose"]);
});
