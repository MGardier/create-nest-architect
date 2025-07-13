import { resolve } from "path";
import { mkdir } from "fs/promises";
import { promises as fs } from 'fs';
import chalk from "../../node_modules/chalk/source/index";

export abstract class UtilFs {

    static async createDirectory(dirPath: string) {
      try {
        const targetDir = resolve(process.cwd(), dirPath);
        await mkdir(targetDir, { recursive: true }); // recursive => ne plante pas si le folder existe
        console.log(chalk.green(`✅ Folder created at: ${targetDir}`));
    
      } catch (error) {
        console.error(chalk.red(`❌ Failed to create folder: ${error}`));
        process.exit(1);
    
      }
    }

    static async createFile(filePath: string, content: string) {
      const targetFile = resolve(process.cwd(), filePath);
      await fs.writeFile(targetFile, content, 'utf8');
      console.log(`✅ File created at: ${targetFile}`);
    }
}