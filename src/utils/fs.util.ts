import { resolve } from "path";
import { mkdir } from "fs/promises";
import { promises as fs } from "fs";
import { MessageUtil } from "./message.util";


export abstract class FsUtil {
  static async createDirectory(dirPath: string): Promise<void> {
    try {
      const targetDir = resolve(process.cwd(), dirPath);
      await mkdir(targetDir, { recursive: true }); // recursive => ne plante pas si le folder existe
      MessageUtil.success(`Folder created at: ${targetDir}`);
    } catch (error) {
      MessageUtil.error(`Failed to create folder: ${error}`);
      process.exit(1);
    }
  }

  static async createFile(filePath: string, content: string): Promise<void> {
    const targetFile = resolve(process.cwd(), filePath);
    await fs.writeFile(targetFile, content, "utf8");
    MessageUtil.success(`File created at: ${targetFile}`);
  }
  
  static async getFileContent(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  static async updateEnvExampleIfNeeded(projectName: string, key:string , value: string): Promise<void>{   
    const envExamplePath = resolve(process.cwd(), `${projectName}/.env.example`);
    let envExampleContent = await FsUtil.getFileContent(envExamplePath);
    if (!envExampleContent.includes( `${key}=`)) {
        envExampleContent += `\n${key}="${value}"\n`;
        await FsUtil.createFile(envExamplePath, envExampleContent);
        MessageUtil.success( `Added ${key} to .env.example`);
    } else {
        MessageUtil.info(`${key} already exists in .env.example`);
    }
  }

  static async addImportInModuleClean(content: string, importFile: string, importModule: string ): Promise<string> {
    let result =  content.replace(
         /(\/\/ Infrastructure \(Concrete implementation - adapters, ormModules, etc\.\))/,
        `$1\n${importFile};`
    );
    return result.replace(
        /(\/\/ Import necessary modules here \(ormModules, etc\.\))/,
        `$1\n    ${importModule},`
    );
  }

  static async addLineInFileFeatured(content: string, newContent: string): Promise<string> {
    return content.replace(
         /(\/\/ Import necessary modules here \(ormModules, etc\.\))/,
        `$1\n   ${newContent}`
    );
  }

}
