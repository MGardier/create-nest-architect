import { ConfigChoice } from "../classes/configChoice.class";
import { resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { MessageUtil } from "../utils/message.util";
import { FsUtil } from "../utils/fs.util";
import { TEMPLATE_PATH } from "../constants/constant";

export abstract class SetUpMongoose {

    static async exec(configChoice: ConfigChoice) {
        const targetDir = resolve(process.cwd(), configChoice.projectName);
        await this.installMongoose(targetDir);
        if (configChoice.isArchitectureTypeClean()) {
            this.setUpMongooseClean(targetDir, configChoice);
        }
        else {
            this.setUpMongooseFeatured(targetDir, configChoice);
        }
    }

    static async setUpMongooseClean(targetDir: string, configChoice: ConfigChoice): Promise<void>  {
        const mongooseDir = resolve(process.cwd(), `${configChoice.projectName}/src/infrastructure/repositories/mongoose/`);

        MessageUtil.info(`Creating Mongoose config folder in ${mongooseDir}...`);
        await FsUtil.createDirectory(mongooseDir);

        const mongooseModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.MONGOOSE_MODULE}`));
        await FsUtil.createFile(`${mongooseDir}/mongoose.module.ts`, mongooseModuleContent);
        MessageUtil.success(`mongoose.module.ts generated`);

        await FsUtil.createDirectory(`${mongooseDir}/schemas`);
        const mongooseEntityContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.MONGOOSE_ENTITY}`));
        await FsUtil.createFile(`${mongooseDir}/schemas/product.entity.ts`, mongooseEntityContent);
        MessageUtil.success(`mongoose.product.entity.ts generated`);
 
        const appModulePath = resolve(process.cwd(), `${configChoice.projectName}/src/app.module.ts`);
        let appModuleContent = await FsUtil.getFileContent(appModulePath);

        appModuleContent = appModuleContent.replace(
            /(\/\/ Infrastructure \(Concrete implementation - adapters, ormModules, etc\.\))/,
            `$1\n            import { MongooseModule } from './infrastructure/repositories/mongoose/mongoose.module';`
        );

        appModuleContent = appModuleContent.replace(
            /(\/\/ Import necessary modules here \(ormModules, etc\.\))/,
            `$1\n            MongooseModule,`
        );

        await FsUtil.createFile(appModulePath, appModuleContent);
        MessageUtil.success(`MongooseModule correctly imported and registered in AppModule`);

        FsUtil.updateEnvExampleIfNeeded(configChoice.projectName, "MONGODB_URI", "mongodb://username:password@host:port/db?authSource=admin");
    }


    static async setUpMongooseFeatured(targetDir: string, configChoice: ConfigChoice) {
        const mongooseProductDir = resolve(process.cwd(), `${configChoice.projectName}/src/product/`);

        const appModulePath : string = resolve(process.cwd(), `${configChoice.projectName}/src/app.module.ts`);
        let appModuleContent : string  = await FsUtil.getFileContent(resolve(process.cwd(), appModulePath));
        const exampleDbUrl : string = "'mongodb://username:password@host:port/db?authSource=admin'";

        const mongooseImportModule: string  =  `MongooseModule.forRoot(env.DATABASE_URL || ${exampleDbUrl})` 
          
        const matchAppModuleContent = appModuleContent.match(/imports\s*:\s*\[(.*?)\]/s);

        if (!matchAppModuleContent) {
            MessageUtil.error(`An error happened when updating app.module.ts .`);
            process.exit(1)
        }

        //Add prisma import 
        appModuleContent = `import { MongooseModule } from '@nestjs/mongoose' \n${appModuleContent}`

        const currentAppModuleImports = matchAppModuleContent[1].trim();

        //add module in imports
        const newAppModuleImports = `${currentAppModuleImports},\n    ${mongooseImportModule},`;

        //Replace imports in app module content
        appModuleContent = appModuleContent.replace(
        /imports\s*:\s*\[(.*?)\]/s,
        `imports: [\n    ${newAppModuleImports}\n  ]`
        );
        
        await FsUtil.createFile(appModulePath, appModuleContent);
        MessageUtil.success(`app.module.ts updated`);

        const mongooseEntityContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.MONGOOSE_ENTITY}`));
        await FsUtil.createFile(`${mongooseProductDir}/entities/product.entity.ts`, mongooseEntityContent);
        MessageUtil.success(`mongoose.product.entity.ts generated`);


        const productModulePath : string = resolve(process.cwd(), `${configChoice.projectName}/src/product/product.module.ts`);
        let productModuleContent : string  = await FsUtil.getFileContent(resolve(process.cwd(), productModulePath));
        
         const matchProductModuleContent = productModuleContent.match(/imports\s*:\s*\[(.*?)\]/s);

        if (!matchProductModuleContent) {
            MessageUtil.error(`An error append when updating app.module.ts .`);
            process.exit(1)
        }

        
        productModuleContent = `import { MongooseModule } from '@nestjs/mongoose' \n${appModuleContent}`

        const currentProductModuleImports = matchProductModuleContent[1].trim();


    

        //add module in imports
        const newImports = `${currentProductModuleImports}\n   MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),`;

        //Replace imports in app module content
        productModuleContent = productModuleContent.replace(
        /imports\s*:\s*\[(.*?)\]/s,
        `imports: [\n    ${newImports}\n  ]`
        );
        
        await FsUtil.createFile(productModulePath, productModuleContent);
        MessageUtil.success(`product.module.ts updated`);

      
        //un example de module pour product
        FsUtil.updateEnvExampleIfNeeded(configChoice.projectName, "MONGODB_URI", "mongodb://username:password@host:port/db?authSource=admin");

    }
    
    static async installMongoose(targetDir: string) {
        const exec = promisify(execCb);
        MessageUtil.info('Installing Mongoose...');
        await exec(`npm i @nestjs/mongoose mongoose`, {
            cwd: targetDir,
            shell: "/bin/bash"
        });
        MessageUtil.success('Mongoose successfully installed');
    }


}