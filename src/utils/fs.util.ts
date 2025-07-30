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


   /********************** ADD NEW MODULE METHOD   *************************************************************************************************************/

  static  addNewModuleClean(content: string, importFile: string, importModule: string ): string {
    let result =  content.replace(
         /(\/\/ Infrastructure \(Concrete implementation - adapters, ormModules, etc\.\))/,
        `$1\n${importFile};`
    );
    return result.replace(
        /(\/\/ Import necessary modules here \(ormModules, etc\.\))/,
        `$1\n    ${importModule},`
    );
  }

  static  addNewModuleFeatured(content: string, importFile: string, importModule: string): string {
          const regex = /imports\s*:\s*\[(.*?)\]/s;

        const matchContent: RegExpMatchArray | null = content.match(regex);
        let currentModuleImports: string |  null = null
        if(matchContent)
          currentModuleImports = matchContent[1].trim()
        
        content = `${importFile} \n${content}`

    
        let moduleImports: string ;
        if(currentModuleImports)
         moduleImports = `${currentModuleImports},\n    ${importModule}`;
        else
          moduleImports = `\n    ${importModule}`;

        
        return  content.replace(
        /imports\s*:\s*\[(.*?)\]/s,
        `imports: [\n    ${moduleImports}\n  ]`
        );
   
  }

}
