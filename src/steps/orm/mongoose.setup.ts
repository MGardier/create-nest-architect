import { ARCHITECTURE_TYPE, DATABASE, DATABASE_META } from "../../config/choices";
import { ConfigChoice } from "../../config/config.types";
import { TEMPLATE_PATH } from "../../constants/constant";
import { VirtualTreeService } from "../../services/virtual-tree.service";
import { ModuleImport, ModuleInjectorService } from "../../services/module-injector.service";
import { MessageUtil } from "../../utils/message.util";
import { OrmMeta, readTemplate, updateEnvExampleIfNeeded } from "./orm-setup.types";

// =============================================================================
//                              META
// =============================================================================

export const MONGOOSE_META: OrmMeta = {
    id: "mongoose",
    label: "📦   Mongoose",
    supportedDatabases: [DATABASE.MONGODB],
    dependencies: ["@nestjs/mongoose", "mongoose"],
};

// =============================================================================
//                              PATHS
// =============================================================================

/** Clean isolates Mongoose in the infrastructure layer... */
const MONGOOSE_DIR = "src/infrastructure/repositories/mongoose";

/** ...while Featured keeps it in the example feature folder. */
const PRODUCT_DIR = "src/product";

const entityPath = (config: ConfigChoice): string =>
    config.architectureType === ARCHITECTURE_TYPE.CLEAN
        ? `${MONGOOSE_DIR}/schemas/product.entity.ts`
        : `${PRODUCT_DIR}/entities/product.entity.ts`;

// =============================================================================
//                            APP MODULE IMPORT
// =============================================================================


const connectionUrl = (config: ConfigChoice): string =>
    `process.env.DATABASE_URL || '${DATABASE_META[config.database].envUrlExample}'`;

/** Clean imports the MongooseModule it owns... */
const CLEAN_IMPORT: ModuleImport = {
    importPath: "./infrastructure/repositories/mongoose/mongoose.module",
    namedImports: ["MongooseModule"],
    entry: "MongooseModule",
};

/** ...Featured connects through the package itself. */
const featuredImport = (config: ConfigChoice): ModuleImport => ({
    importPath: "@nestjs/mongoose",
    namedImports: ["MongooseModule"],
    entry: `MongooseModule.forRoot(${connectionUrl(config)})`,
});

const appModuleImport = (config: ConfigChoice): ModuleImport =>
    config.architectureType === ARCHITECTURE_TYPE.CLEAN
        ? CLEAN_IMPORT
        : featuredImport(config);

// =============================================================================
//                              SETUP
// =============================================================================

/**
 * One method per file written, in the order of MONGOOSE_ACTIONS
 * (orm.step.ts). The two architectures are not symmetric — Clean owns a
 * MongooseModule of its own, Featured imports it from the package — so
 * the methods that concern only one of them return early for the other.
 */
export const MongooseSetup = {

    writeModule: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
        // Featured has no module of its own: MongooseModule is imported from the package
        if (config.architectureType !== ARCHITECTURE_TYPE.CLEAN) return;

        MessageUtil.info(`\nGenerating mongoose module in ${MONGOOSE_DIR}...`);
        tree.write(`${MONGOOSE_DIR}/mongoose.module.ts`, await readTemplate(TEMPLATE_PATH.mongoose.module));
    },

    writeEntity: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
        const path = entityPath(config);
        MessageUtil.info(`\nGenerating mongoose example entity in ${path}...`);
        tree.write(path, await readTemplate(TEMPLATE_PATH.mongoose.entity));
    },

    updateAppModule: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
        MessageUtil.info(`\nUpdating app.module...`);

        tree.write("src/app.module.ts", ModuleInjectorService.addModuleImport(
            tree.read("src/app.module.ts"),
            appModuleImport(config)
        ));
    },

    updateEnvExample: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
        updateEnvExampleIfNeeded(tree, "DATABASE_URL", DATABASE_META[config.database].envUrlExample);
    },

    /** Writes nothing: closes the setup and returns its recap. */
    nextSteps: async (_tree: VirtualTreeService, config: ConfigChoice): Promise<string> => {
        MessageUtil.success(
            config.architectureType === ARCHITECTURE_TYPE.CLEAN
                ? `MongooseModule correctly imported and AppModule correctly updated.`
                : `Mongoose module correctly generating and app module correctly updated.`
        );

        return `
    👉 Before starting dont forget to :

      - Create .env and connect your MongoDB with Mongoose.
      - Add your entites and modules with mongoose.
    `;
    },
};
