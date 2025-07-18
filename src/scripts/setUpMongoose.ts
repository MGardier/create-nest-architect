import { ConfigChoice } from "../classes/configChoice.class";
import { resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { MessageUtil } from "../utils/message.util";
import { FsUtil } from "../utils/fs.util";
import { TEMPLATE_PATH } from "../constants/constant";

export abstract class SetUpMongoose {

    static async exec(configChoice: ConfigChoice): Promise<void>  {
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
        const mongooseDir = `${targetDir}/src/infrastructure/repositories/mongoose/`;
        const appModulePath = resolve(process.cwd(), `${configChoice.projectName}/src/app.module.ts`);



        //TODO: Sortir les méthodes de création des différents fichier 

        MessageUtil.info(`Creating Mongoose config folder in ${mongooseDir}...`);
        await FsUtil.createDirectory(mongooseDir);

        const mongooseModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.MONGOOSE_MODULE}`));
        await FsUtil.createFile(`${mongooseDir}/mongoose.module.ts`, mongooseModuleContent);
        MessageUtil.success(`mongoose.module.ts generated`);

        await FsUtil.createDirectory(`${mongooseDir}/schemas`);
        const mongooseEntityContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.MONGOOSE_ENTITY}`));
        await FsUtil.createFile(`${mongooseDir}/schemas/product.entity.ts`, mongooseEntityContent);
        MessageUtil.success(`mongoose.product.entity.ts generated`);
 
        let appModuleContent = await FsUtil.getFileContent(appModulePath);

        //Ajout de l'import du fichier et du module 
        appModuleContent = await  FsUtil.addImportInModuleClean(
            appModuleContent,
            `import { MongooseModule } from './infrastructure/repositories/mongoose/mongoose.module'`,
            `MongooseModule`
        );


        await FsUtil.createFile(appModulePath, appModuleContent);
        MessageUtil.success(`MongooseModule correctly imported and registered in AppModule`);

        FsUtil.updateEnvExampleIfNeeded(configChoice.projectName, "MONGODB_URI", "mongodb://username:password@host:port/db?authSource=admin");
    }


    static async setUpMongooseFeatured(targetDir: string, configChoice: ConfigChoice): Promise<void> {

        //Get all path for project
        const mongooseProductDir = `${targetDir}/src/product/`;
        const appModulePath : string = resolve(process.cwd(), `${configChoice.projectName}/src/app.module.ts`);
        const productModulePath : string = resolve(process.cwd(), `${configChoice.projectName}/src/product/product.module.ts`);


        const  currentAppModuleContent : string  = await FsUtil.getFileContent(resolve(process.cwd(), appModulePath));
        const dbUrl : string = "'mongodb://username:password@host:port/db?authSource=admin'";


        
        const mongooseImportModule: string  =  `MongooseModule.forRoot(env.DATABASE_URL || ${dbUrl})` 
          

        const newAppModuleContent =  FsUtil.addLineInFileFeatured(currentAppModuleContent,"import { MongooseModule } from '@nestjs/mongoose'",mongooseImportModule)


        
        await FsUtil.createFile(appModulePath, newAppModuleContent);
        MessageUtil.success(`app.module.ts updated`);

        const mongooseEntityContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.MONGOOSE_ENTITY}`));
        await FsUtil.createFile(`${mongooseProductDir}/entities/product.entity.ts`, mongooseEntityContent);
        MessageUtil.success(`mongoose.product.entity.ts generated`);


        
        const currentProductModuleContent : string  = await FsUtil.getFileContent(resolve(process.cwd(), productModulePath));
        const newImports = `MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),`;

        const newProductModuleContent =  FsUtil.addLineInFileFeatured(currentProductModuleContent,"import { MongooseModule } from '@nestjs/mongoose'",newImports)
        
      
        await FsUtil.createFile(productModulePath, newProductModuleContent);
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