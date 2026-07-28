import { resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { ARCHITECTURE_TYPE, DATABASE, DATABASE_META } from "../../config/choices";
import { ConfigChoice } from "../../config/config.types";
import { TEMPLATE_PATH } from "../../constants/constant";
import { FsUtil } from "../../utils/fs.util";
import { MessageUtil } from "../../utils/message.util";
import type { OrmInstaller } from "./orm-installer.types";

// =============================================================================
//                              CLEAN METHOD 
// =============================================================================
const setUpMongooseClean = async (targetDir: string, config: ConfigChoice): Promise<void> => {

    const mongooseDir = `${targetDir}/src/infrastructure/repositories/mongoose/`;


    MessageUtil.info(`\nCreating Mongoose config folder in ${mongooseDir}...`);
    await FsUtil.createDirectory(mongooseDir);

    MessageUtil.info(`\nGenerating mongoose module...`);
    const mongooseModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../../templates/${TEMPLATE_PATH.MONGOOSE_MODULE}`));
    await FsUtil.createFile(`${mongooseDir}/mongoose.module.ts`, mongooseModuleContent);


    MessageUtil.info(`\nGenerating mongoose example entity...`);
    await FsUtil.createDirectory(`${mongooseDir}/schemas`);
    const mongooseEntityContent = await FsUtil.getFileContent(resolve(__dirname, `../../templates/${TEMPLATE_PATH.MONGOOSE_ENTITY}`));
    await FsUtil.createFile(`${mongooseDir}/schemas/product.entity.ts`, mongooseEntityContent);

    MessageUtil.info(`\nUpdating app module...`);
    const appModulePath = `${targetDir}/src/app.module.ts`;
    let appModuleContent = await FsUtil.getFileContent(appModulePath);
    appModuleContent =  FsUtil.addNewModuleClean(
        appModuleContent,
        `import { MongooseModule } from './infrastructure/repositories/mongoose/mongoose.module'`,
        `MongooseModule`
    );
    await FsUtil.createFile(appModulePath, appModuleContent);

    MessageUtil.success(`MongooseModule correctly imported and AppModule correctly updated.`);

    FsUtil.updateEnvExampleIfNeeded(config.projectName, "DATABASE_URL", DATABASE_META[config.database].envUrlExample);
};

// =============================================================================
//                              FEATURED  METHOD
// =============================================================================
const setUpMongooseFeatured = async (targetDir: string, config: ConfigChoice): Promise<void> => {


    const mongooseDir = `${targetDir}/src/product/`;
    const appModulePath: string = `${targetDir}/src/app.module.ts`;
    const productModulePath: string = `${targetDir}/src/product/product.module.ts`;


    MessageUtil.info(`\nGenerating mongoose example  entity in ${mongooseDir}...`);
    const mongooseEntityContent = await FsUtil.getFileContent(resolve(__dirname, `../../templates/${TEMPLATE_PATH.MONGOOSE_ENTITY}`));
    await FsUtil.createFile(`${mongooseDir}/entities/product.entity.ts`, mongooseEntityContent);


    MessageUtil.info(`\nUpdating example entity module...`);
    const currentProductModuleContent: string = await FsUtil.getFileContent(resolve(process.cwd(), productModulePath));
    const newMongooseModuleForProductModule = `MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])`;
    const newImportsForProductModule = `
        import { MongooseModule } from '@nestjs/mongoose';
        import { Product, ProductSchema } from './entities/product.entity';
    `
    const newProductModuleContent = FsUtil.addNewModuleFeatured(currentProductModuleContent, newImportsForProductModule, newMongooseModuleForProductModule)
    await FsUtil.createFile(productModulePath, newProductModuleContent);

    MessageUtil.info(`\nUpdating app.module...`);
    const currentAppModuleContent: string = await FsUtil.getFileContent(appModulePath);
    const dbUrl: string = `'${DATABASE_META[config.database].envUrlExample}'`;

    const mongooseImportModule: string = `MongooseModule.forRoot(process.env.DATABASE_URL || ${dbUrl})`;
    const newAppModuleContent = FsUtil.addNewModuleFeatured(currentAppModuleContent, "import { MongooseModule } from '@nestjs/mongoose'", mongooseImportModule);
    await FsUtil.createFile(appModulePath, newAppModuleContent);
    MessageUtil.success(`Mongoose module correctly generating and app module correctly updated.`);

    FsUtil.updateEnvExampleIfNeeded(config.projectName, "DATABASE_URL", DATABASE_META[config.database].envUrlExample);
};

// =============================================================================
//                              INSTALL METHOD
// =============================================================================

const installMongoose = async (targetDir: string, config: ConfigChoice): Promise<void> => {
    const exec = promisify(execCb);
    const { packager } = config;

    await exec(packager.add('@nestjs/mongoose mongoose'), {
        cwd: targetDir,
        shell: "/bin/bash"
    });
    MessageUtil.success('Mongoose successfully installed');
};

// =============================================================================
//                              INSTALLER
// =============================================================================

export const mongooseInstaller: OrmInstaller = {
    id: "mongoose",
    label: "📦   Mongoose",
    supportedDatabases: [DATABASE.MONGODB],

    async run(config: ConfigChoice): Promise<string> {
        MessageUtil.info('\nInstalling Mongoose...');
        const targetDir = resolve(process.cwd(), config.projectName);
        await installMongoose(targetDir, config);
        if (config.architectureType === ARCHITECTURE_TYPE.CLEAN) {
            await setUpMongooseClean(targetDir, config);
        }
        else {
            await setUpMongooseFeatured(targetDir, config);
        }

        return `
    👉 Before starting dont forget to :

      - Create .env and connect your MongoDB with Mongoose.
      - Add your entites and modules with mongoose.
    `;
    },
};
