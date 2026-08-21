import { ARCHITECTURE_TYPE, DATABASE, DATABASE_META } from "../../config/choices";
import { ConfigChoice } from "../../config/config.types";
import { TEMPLATE_PATH } from "../../constants/constant";
import { VirtualTree } from "../../services/tree.service";
import { FsUtil } from "../../utils/fs.util";
import { MessageUtil } from "../../utils/message.util";
import { OrmInstaller, readTemplate, updateEnvExampleIfNeeded } from "./orm-installer.types";

// =============================================================================
//                              CLEAN METHOD
// =============================================================================

const setUpMongooseClean = async (tree: VirtualTree): Promise<void> => {
    const mongooseDir = "src/infrastructure/repositories/mongoose";

    MessageUtil.info(`\nGenerating mongoose module in ${mongooseDir}...`);
    tree.write(`${mongooseDir}/mongoose.module.ts`, await readTemplate(TEMPLATE_PATH.mongoose.module));

    MessageUtil.info(`\nGenerating mongoose example entity...`);
    tree.write(`${mongooseDir}/schemas/product.entity.ts`, await readTemplate(TEMPLATE_PATH.mongoose.entity));

    MessageUtil.info(`\nUpdating app module...`);
    const appModuleContent = FsUtil.addNewModuleClean(
        tree.read("src/app.module.ts"),
        `import { MongooseModule } from './infrastructure/repositories/mongoose/mongoose.module'`,
        `MongooseModule`
    );
    tree.write("src/app.module.ts", appModuleContent);

    MessageUtil.success(`MongooseModule correctly imported and AppModule correctly updated.`);
};

// =============================================================================
//                              FEATURED  METHOD
// =============================================================================

const setUpMongooseFeatured = async (tree: VirtualTree, config: ConfigChoice): Promise<void> => {
    const productDir = "src/product";

    MessageUtil.info(`\nGenerating mongoose example  entity in ${productDir}...`);
    tree.write(`${productDir}/entities/product.entity.ts`, await readTemplate(TEMPLATE_PATH.mongoose.entity));

    MessageUtil.info(`\nUpdating example entity module...`);
    const newMongooseModuleForProductModule = `MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])`;
    const newImportsForProductModule = `
        import { MongooseModule } from '@nestjs/mongoose';
        import { Product, ProductSchema } from './entities/product.entity';
    `
    const newProductModuleContent = FsUtil.addNewModuleFeatured(
        tree.read(`${productDir}/product.module.ts`),
        newImportsForProductModule,
        newMongooseModuleForProductModule
    );
    tree.write(`${productDir}/product.module.ts`, newProductModuleContent);

    MessageUtil.info(`\nUpdating app.module...`);
    const dbUrl: string = `'${DATABASE_META[config.database].envUrlExample}'`;
    const mongooseImportModule: string = `MongooseModule.forRoot(process.env.DATABASE_URL || ${dbUrl})`;
    const newAppModuleContent = FsUtil.addNewModuleFeatured(
        tree.read("src/app.module.ts"),
        "import { MongooseModule } from '@nestjs/mongoose'",
        mongooseImportModule
    );
    tree.write("src/app.module.ts", newAppModuleContent);

    MessageUtil.success(`Mongoose module correctly generating and app module correctly updated.`);
};

// =============================================================================
//                              INSTALLER
// =============================================================================

export const mongooseInstaller: OrmInstaller = {
    id: "mongoose",
    label: "📦   Mongoose",
    supportedDatabases: [DATABASE.MONGODB],
    dependencies: ["@nestjs/mongoose", "mongoose"],

    async run(tree: VirtualTree, config: ConfigChoice): Promise<string> {
        MessageUtil.info('\nInstalling Mongoose...');

        if (config.architectureType === ARCHITECTURE_TYPE.CLEAN) {
            await setUpMongooseClean(tree);
        }
        else {
            await setUpMongooseFeatured(tree, config);
        }

        updateEnvExampleIfNeeded(tree, "DATABASE_URL", DATABASE_META[config.database].envUrlExample);

        return `
    👉 Before starting dont forget to :

      - Create .env and connect your MongoDB with Mongoose.
      - Add your entites and modules with mongoose.
    `;
    },
};
