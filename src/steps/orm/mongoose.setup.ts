import { ARCHITECTURE_TYPE, DATABASE, DATABASE_META } from "../../config/choices";
import { ConfigChoice } from "../../config/config.types";
import { TEMPLATE_PATH } from "../../constants/constant";
import { VirtualTreeService } from "../../services/virtual-tree.service";
import { GlobalPipe, ModuleImport, ModuleInjectorService } from "../../services/module-injector.service";
import { MessageUtil } from "../../utils/message.util";
import { OrmMeta, readTemplate, updateEnvExampleIfNeeded } from "./orm-setup.types";

// =============================================================================
//                              META
// =============================================================================

export const MONGOOSE_META: OrmMeta = {
    id: "mongoose",
    label: "📦   Mongoose",
    supportedDatabases: [DATABASE.MONGODB],
    dependencies: [
        "@nestjs/mongoose",
        "mongoose",
        // The generated DTO is validated: without these two the decorators are inert
        "class-validator",
        "class-transformer",
    ],
};

// =============================================================================
//                              PATHS
// =============================================================================

/**
 * The same example, laid out the way each architecture expects it:
 * Featured gathers it in one feature folder, Clean spreads it across
 * its four layers. One entry per file written.
 */
interface MongoosePaths {
    database: string;
    files: { template: string; target: string }[];
}

const FEATURED_DIR = "src/product";

const FEATURED_PATHS: MongoosePaths = {
    database: "src/database/database.module.ts",
    files: [
        { template: TEMPLATE_PATH.mongoose.featured.entity, target: `${FEATURED_DIR}/entities/product.entity.ts` },
        { template: TEMPLATE_PATH.mongoose.featured.dto, target: `${FEATURED_DIR}/dto/create-product.dto.ts` },
        { template: TEMPLATE_PATH.mongoose.featured.service, target: `${FEATURED_DIR}/product.service.ts` },
        { template: TEMPLATE_PATH.mongoose.featured.controller, target: `${FEATURED_DIR}/product.controller.ts` },
        { template: TEMPLATE_PATH.mongoose.featured.module, target: `${FEATURED_DIR}/product.module.ts` },
    ],
};

const MONGOOSE_DIR = "src/infrastructure/repositories/mongoose";

const CLEAN_PATHS: MongoosePaths = {
    database: `${MONGOOSE_DIR}/database.module.ts`,
    files: [
        { template: TEMPLATE_PATH.mongoose.clean.entity, target: "src/domain/entities/product.entity.ts" },
        { template: TEMPLATE_PATH.mongoose.clean.repository, target: "src/domain/repositories/product.repository.ts" },
        { template: TEMPLATE_PATH.mongoose.clean.useCase, target: "src/application/use-cases/create-product.use-case.ts" },
        { template: TEMPLATE_PATH.mongoose.clean.schema, target: `${MONGOOSE_DIR}/schemas/product.schema.ts` },
        { template: TEMPLATE_PATH.mongoose.clean.mongooseRepository, target: `${MONGOOSE_DIR}/product.mongoose.repository.ts` },
        { template: TEMPLATE_PATH.mongoose.clean.dto, target: "src/presentation/dto/create-product.dto.ts" },
        { template: TEMPLATE_PATH.mongoose.clean.controller, target: "src/presentation/controllers/product.controller.ts" },
        { template: TEMPLATE_PATH.mongoose.clean.module, target: "src/presentation/product.module.ts" },
    ],
};

const pathsFor = (config: ConfigChoice): MongoosePaths =>
    config.architectureType === ARCHITECTURE_TYPE.CLEAN ? CLEAN_PATHS : FEATURED_PATHS;

/** Where the example's ProductModule lands, so app.module.ts can import it. */
const productModulePath = (config: ConfigChoice): string =>
    config.architectureType === ARCHITECTURE_TYPE.CLEAN
        ? "./presentation/product.module"
        : "./product/product.module";

// =============================================================================
//                            APP MODULE IMPORTS
// =============================================================================

/**
 * Both architectures import the same two modules; only the paths
 * differ. Clean gets a third one: it has no ConfigModule of its own,
 * and the DatabaseModule reads DATABASE_URL through the ConfigService.
 */
const CONFIG_IMPORT: ModuleImport = {
    importPath: "@nestjs/config",
    namedImports: ["ConfigModule"],
    entry: "ConfigModule.forRoot({ isGlobal: true })",
};

const appModuleImports = (config: ConfigChoice): ModuleImport[] => {
    const isClean = config.architectureType === ARCHITECTURE_TYPE.CLEAN;

    const databaseImport: ModuleImport = {
        importPath: isClean
            ? "./infrastructure/repositories/mongoose/database.module"
            : "./database/database.module",
        namedImports: ["DatabaseModule"],
        entry: "DatabaseModule",
    };

    const productImport: ModuleImport = {
        importPath: productModulePath(config),
        namedImports: ["ProductModule"],
        entry: "ProductModule",
    };

    return isClean
        ? [CONFIG_IMPORT, databaseImport, productImport]
        : [databaseImport, productImport];
};

// =============================================================================
//                              VALIDATION PIPE
// =============================================================================

/** What makes the DTO decorators actually reject a malformed payload. */
const VALIDATION_PIPE: GlobalPipe = {
    importPath: "@nestjs/common",
    namedImports: ["ValidationPipe"],
    expression: "new ValidationPipe({ whitelist: true, transform: true })",
};

// =============================================================================
//                              SETUP
// =============================================================================

/**
 * One method per unit of work, in the order of MONGOOSE_ACTIONS
 * (orm.step.ts). The architecture only decides which path table is
 * used: the methods themselves are written once for both.
 */
export const MongooseSetup = {

    writeDatabaseModule: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
        const path = pathsFor(config).database;
        MessageUtil.info(`\nGenerating mongoose connection in ${path}...`);
        tree.write(path, await readTemplate(TEMPLATE_PATH.mongoose.database));
    },

    writeExample: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
        MessageUtil.info(`\nGenerating the ${config.architectureType} product example...`);

        for (const file of pathsFor(config).files) {
            tree.write(file.target, await readTemplate(file.template));
        }
    },

    updateAppModule: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
        MessageUtil.info(`\nUpdating app.module...`);

        // Each pass reads back what the previous one wrote: the tree is the source of truth
        for (const moduleImport of appModuleImports(config)) {
            tree.write("src/app.module.ts", ModuleInjectorService.addModuleImport(
                tree.read("src/app.module.ts"),
                moduleImport
            ));
        }
    },

    updateMain: async (tree: VirtualTreeService, _config: ConfigChoice): Promise<void> => {
        MessageUtil.info(`\nRegistering the global ValidationPipe in main...`);

        tree.write("src/main.ts", ModuleInjectorService.addGlobalPipe(
            tree.read("src/main.ts"),
            VALIDATION_PIPE
        ));
    },

    updateEnvExample: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
        updateEnvExampleIfNeeded(tree, "DATABASE_URL", DATABASE_META[config.database].envUrlExample);
    },

    /** Writes nothing: closes the setup and returns its recap. */
    nextSteps: async (_tree: VirtualTreeService, config: ConfigChoice): Promise<string> => {
        MessageUtil.success(`Mongoose example correctly generated and AppModule correctly updated.`);

        const exampleDir = config.architectureType === ARCHITECTURE_TYPE.CLEAN
            ? "src/domain, src/application, src/infrastructure and src/presentation"
            : FEATURED_DIR;

        return `
    👉 Before starting dont forget to :

      - Create .env and set DATABASE_URL to your MongoDB connection string.
      - Try the generated example: POST /products with { "name": "...", "price": 0 }
      - The example lives in ${exampleDir} — copy it to add your own entities.
    `;
    },
};
