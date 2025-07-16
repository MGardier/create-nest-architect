import { ConfigChoice } from "../classes/configChoice.class";
import { FsUtil } from "../utils/fs.util";
import { MessageUtil } from "../utils/message.util";
import { join, resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { TEMPLATE_PATH } from "../constants/constant";
import { promises as fs } from "fs";

export abstract class SetUpPrisma {

    static async exec(configChoice: ConfigChoice) {
        const targetDir = resolve(process.cwd(), configChoice.projectName);
    
        if (configChoice.isArchitectureTypeClean()) {
          await this.setUpPrismaClean(targetDir, configChoice);
        }
        else {
          await this.setUpPrismaLayered(targetDir, configChoice);
        }
    }

    static async setUpPrismaClean(targetDir: string, configChoice: ConfigChoice) {
        const exec = promisify(execCb);
        MessageUtil.info('Installing Prisma...');
        await exec(`npm install prisma @prisma/client && npx prisma init`, {
            cwd: targetDir,
            shell: "/bin/bash"
        });
        MessageUtil.success('Prisma successfully installed');

        MessageUtil.info('Moving Prisma...');
        await exec(`mkdir -p src/infrastructure/repositories/prisma/.config && mv prisma/* src/infrastructure/repositories/prisma/.config && rmdir prisma`, {
            cwd: targetDir,
            shell: "/bin/bash"
        });
        MessageUtil.success(`Prisma moved in src/infrastructure/repositories/prisma/.config`);

        const prismaDir = resolve(process.cwd(), `${configChoice.projectName}/src/infrastructure/repositories/prisma/.config`);

        const prismaModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_MODULE}`));
        const prismaServiceContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_SERVICE}`));

        const appModulePath = resolve(process.cwd(), `${configChoice.projectName}/src/app.module.ts`);
        let appModuleContent = await FsUtil.getFileContent(appModulePath);

        MessageUtil.info(`Generating prisma.module in ${prismaDir}...`);
        await FsUtil.createFile(`${prismaDir}/prisma.module.ts`, prismaModuleContent);

        MessageUtil.info(`Generating prisma.service in ${prismaDir}...`);
        await FsUtil.createFile(`${prismaDir}/prisma.service.ts`, prismaServiceContent);

        // ajout dans app.module
        appModuleContent = appModuleContent.replace(
            /(\/\/ Infrastructure \(Concrete implementation - adapters, ormModules, etc\.\))/,
            `$1 
            import { PrismaModule } from './infrastructure/repositories/prisma/.config/prisma.module';`
        );

        appModuleContent = appModuleContent.replace(
            /(\/\/ Import necessary modules here \(ormModules, etc\.\))/,
            `$1 
            PrismaModule,`
        );

        await FsUtil.createFile(appModulePath, appModuleContent);
        MessageUtil.success(`PrismaModule correctly imported and registered in AppModule`);

        // ajout dans le package.json
        const packageJsonPath = join(targetDir, 'package.json');
        const packageJsonContent = await FsUtil.getFileContent(packageJsonPath);
        const packageJson = JSON.parse(packageJsonContent);

        packageJson.prisma = {
            schema: "src/infrastructure/repositories/prisma/.config/schema.prisma"
        };

        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2)); // indentation
        MessageUtil.success('Added prisma.schema path to package.json');

        // ajout dans env.example
        const envExamplePath = resolve(process.cwd(), `${configChoice.projectName}/.env.example`);
        let envExampleContent = await FsUtil.getFileContent(envExamplePath);

        // Ajoute la variable si elle n'existe pas déjà (précaution)
        if (!envExampleContent.includes('DATABASE_URL=')) {
            envExampleContent += `\nDATABASE_URL="provider://user:password@host:port/database"\n`;
            await FsUtil.createFile(envExamplePath, envExampleContent);
            MessageUtil.success('Added DATABASE_URL to .env.example');
        } else {
            MessageUtil.info('DATABASE_URL already exists in .env.example');
        }
    }

    static async setUpPrismaLayered(targetDir: string, configChoice: ConfigChoice) {
    
        let prismaDir = resolve(process.cwd(), `${configChoice.projectName}/prisma`);
    
        //Install and init prisma 
        const exec = promisify(execCb);
        MessageUtil.info('Installing Prisma...');
        await exec(`npm install prisma @prisma/client && npx prisma init`, {
            cwd: targetDir,
            shell: "/bin/bash"
        });
        MessageUtil.success('Prisma successfully installed');
    
        //Get content of templates
        const prismaModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_MODULE}`));
        const prismaModulePath = `${prismaDir}/prisma.module.ts`;
    
        const prismaServiceContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_SERVICE}`));
        const prismaServicePath = `${prismaDir}/prisma.service.ts`;
    
        let envExampleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.ENV_EXAMPLE}`));
        const envExamplePath = `.env.example`;
    
        const appModulePath = resolve(process.cwd(), `${configChoice.projectName}/src/app.module.ts`);
        let appModuleContent = await FsUtil.getFileContent(resolve(process.cwd(), appModulePath));
    
        //Creating new file with templat content
        MessageUtil.info(`Generating prisma.module in ${prismaDir}...`);
        await FsUtil.createFile(prismaModulePath, prismaModuleContent);
    
        MessageUtil.info(`Generating prisma.service in ${prismaDir}...`);
        await FsUtil.createFile(prismaServicePath, prismaServiceContent);
    
        const matchContent = appModuleContent.match(/imports\s*:\s*\[(.*?)\]/s);

        if (!matchContent) {
        MessageUtil.error(`An error append when updating app.module.ts .`);
        process.exit(1)
        }

        //Add prisma import 
        appModuleContent = `import { PrismaModule } from 'prisma/prisma.module \n${appModuleContent}`

        const currentImports = matchContent[1].trim();

        //add module in imports
        const newImports = `${currentImports},\n    PrismaModule,`
        ;

        //Replace imports in app module content
        appModuleContent = appModuleContent.replace(
        /imports\s*:\s*\[(.*?)\]/s,
        `imports: [\n    ${newImports}\n  ]`
        );
    
        // TODO; app.module en erreur de compile
        //Update app.module.ts
        await FsUtil.createFile(appModulePath, appModuleContent);
   
        // TODO: .env.example non créé
        // Ajoute la variable si elle n'existe pas déjà (précaution)
        if (!envExampleContent.includes('DATABASE_URL=')) {
            envExampleContent += `\nDATABASE_URL="provider://user:password@host:port/database"\n`;
            await FsUtil.createFile(envExamplePath, envExampleContent);
            MessageUtil.success('Added DATABASE_URL to .env.example');
        } 
        
    }

}