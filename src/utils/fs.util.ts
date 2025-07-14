import { resolve } from "path";
import { mkdir } from "fs/promises";
import { promises as fs } from "fs";
import { MessageUtil } from "./message.util";
import { ARCHITECTURE_TYPE, Constant } from "../constants/constant";

export abstract class FsUtil {
  static async createDirectory(dirPath: string) {
    try {
      const targetDir = resolve(process.cwd(), dirPath);
      await mkdir(targetDir, { recursive: true }); // recursive => ne plante pas si le folder existe
      MessageUtil.success(`Folder created at: ${targetDir}`);
    } catch (error) {
      MessageUtil.error(`Failed to create folder: ${error}`);
      process.exit(1);
    }
  }

  static async createFile(filePath: string, content: string) {
    const targetFile = resolve(process.cwd(), filePath);
    await fs.writeFile(targetFile, content, "utf8");
    MessageUtil.success(`File created at: ${targetFile}`);
  }
  
    static async getFileContent(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }



}
