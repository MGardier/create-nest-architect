import { ConfigChoice } from "../classes/configChoice.class";
import { resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { MessageUtil } from "../utils/message.util";
import { FsUtil } from "../utils/fs.util";

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

    static async setUpMongooseClean(targetDir: string, configChoice: ConfigChoice) {
    
        
    }

    static async setUpMongooseFeatured(targetDir: string, configChoice: ConfigChoice) {
        const appModulePath : string = resolve(process.cwd(), `${configChoice.projectName}/src/app.module.ts`);
        let appModuleContent : string  = await FsUtil.getFileContent(resolve(process.cwd(), appModulePath));

        const moogooseImportModule: string  = 'MongooseModule.forRoot(env.DATABASE_URL || "mongodb://username:password@host:port/db?authSource=admin"),'
          
        const matchContent = appModuleContent.match(/imports\s*:\s*\[(.*?)\]/s);

        if (!matchContent) {
            MessageUtil.error(`An error append when updating app.module.ts .`);
            process.exit(1)
        }

        //Add prisma import 
        appModuleContent = `import { MongooseModule } from '@nestjs/mongoose' \n${appModuleContent}`

        const currentImports = matchContent[1].trim();

        //add module in imports
        const newImports = `${currentImports},\n    PrismaModule,`;

        //Replace imports in app module content
        appModuleContent = appModuleContent.replace(
        /imports\s*:\s*\[(.*?)\]/s,
        `imports: [\n    ${newImports}\n  ]`
        );
        

        //Ajouter une ligne au app.module.ts
        //un example d'entité pour le product  
        //un example de module pour product

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