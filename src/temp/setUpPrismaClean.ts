import { MessageUtil } from "../utils/message.util";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { join, resolve } from "path";
import { ConfigChoice } from "../classes/configChoice.class";
import { FsUtil } from "../utils/fs.util";
import { TEMPLATE_PATH } from "../constants/constant";
import { promises as fs } from "fs";

export abstract class SetUpPrismaClean {

    static async exec(targetDir: string, configChoice: ConfigChoice) {
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
        

        //TODO: Organiser le package.json proprement?

        // const orderedPackageJson = {
        //     name: packageJson.name,
        //     version: packageJson.version,
        //     description: packageJson.description,
        //     author: packageJson.author,
        //     private: packageJson.private,
        //     license: packageJson.license,
        //     prisma: {
        //         schema: "src/infrastructure/repositories/prisma/.config/schema.prisma"
        //     },
        //     scripts: packageJson.scripts,
        //     dependencies: packageJson.dependencies,
        //     devDependencies: packageJson.devDependencies,
        //     jest: packageJson.jest
        // };
        // await fs.writeFile(packageJsonPath, JSON.stringify(orderedPackageJson, null, 2));

    }
}