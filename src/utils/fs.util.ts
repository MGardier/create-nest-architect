import { resolve } from "path";
import { mkdir } from "fs/promises";
import { promises as fs } from "fs";
import { MessageUtil } from "./message.util";


export abstract class FsUtil {

  /********************** DIRECTORY METHOD   *************************************************************************************************************/

  static async createDirectory(dirPath: string): Promise<void> {
    try {
      const targetDir = resolve(process.cwd(), dirPath);
      await mkdir(targetDir, { recursive: true }); // recursive => create folder if not existing
      MessageUtil.success(`Folder created at: ${targetDir}`);
    } catch (error) {
      MessageUtil.error(`Failed to create folder: ${error}`);
      process.exit(1);
    }
  }

  static async deleteDirectory(filePath: string): Promise<void> {
    const targetFile = resolve(process.cwd(), filePath);
    await fs.rm(targetFile,{recursive: true}); // recursive => create folder if not existing
    MessageUtil.success(`File deleted at: ${targetFile}`);
  }

  /**********************  FILE METHOD   *************************************************************************************************************/

  static async createFile(filePath: string, content: string): Promise<void> {
    const targetFile = resolve(process.cwd(), filePath);
    await fs.writeFile(targetFile, content, "utf8");
    MessageUtil.success(`File created at: ${targetFile}`);
  }



  static async getFileContent(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }


  /********************** .ENV FILE METHOD   *************************************************************************************************************/



  static async updateEnvExampleIfNeeded(projectName: string, key: string, value: string): Promise<void> {
    MessageUtil.info(`\nAdding  ${key} to .env.example...`);
    const envExamplePath = resolve(process.cwd(), `${projectName}/.env.example`);
    let envExampleContent = await FsUtil.getFileContent(envExamplePath);
    if (!envExampleContent.includes(`${key}=`)) {
      envExampleContent += `\n${key}="${value}"\n`;
      await FsUtil.createFile(envExamplePath, envExampleContent);
      MessageUtil.success(`.env correctly updated with ${key}`);
    } else {
      MessageUtil.info(`${key} already exists in .env.example`);
    }
  }


  /********************** PRISMA ADD NEW MODULE  METHOD   *************************************************************************************************************/

  static addNewModuleClean(content: string, importFile: string, importModule: string): string {
    const result = content.replace(
      /(\/\/ Infrastructure \(Concrete implementation - adapters, ormModules, etc\.\))/,
      `$1\n${importFile};`
    );
    return result.replace(
      /(\/\/ Import necessary modules here \(ormModules, etc\.\))/,
      `$1\n    ${importModule},`
    );
  }

  static addNewModuleFeatured(content: string, importFile: string, importModule: string): string {
    const result = `${importFile} \n${content}`
    return result.replace(
      /(\/\/ Import necessary modules here \(ormModules, etc\.\))/,
      `$1\n    ${importModule},`
    );

  }

  /********************** PRISMA CONFIG METHOD   *************************************************************************************************************/

  static addOptionInPrismaConfig(content: string, option: string): string {
    return content.replace(
      /(\/\/ Define your prisma options modules here \(ormModules, etc\.\))/,
      `$1\n    ${option},`
    );

  }


  /********************** PACKAGE JSON  METHOD   *************************************************************************************************************/

  static extractProjectNameFromPath(projectName: string): string {
    if (projectName.includes('/') || projectName.includes('\\')) {
      const segments = projectName.split(/[/\\]/);
      return segments[segments.length - 1];
    }
    return projectName;
  }

  static updateProjectNameInPackageJson(content: string, projectName: string,): string {
    const cleanProjectName = FsUtil.extractProjectNameFromPath(projectName);

    return content.replace(
      /("name"\s*:\s*)"[^"]*"/g,
      `$1"${cleanProjectName}"`
    );

  }

}
