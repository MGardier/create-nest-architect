import { existsSync, promises as fs } from "fs";
import { dirname, join, relative, resolve } from "path";
import { StringUtil } from "../utils/string.util";

/** File / directory names never loaded into the tree. */
const EXCLUDED_ENTRIES = [".git"];

/**
 * The project being generated, as an in-memory file tree.
 *
 * - Steps read and write here — never on the disk.
 *
 * - commit() materializes every file at once:
 *   the pipeline's single disk write.
 *
 * - Keys are project-relative paths, "/" separated
 *   (e.g. "src/app.module.ts").
 */
export class VirtualTree {
  private readonly files = new Map<string, string>();

  // =============================================================================
  //                              VIRTUAL METHODS
  // =============================================================================

  read(path: string): string {
    const content = this.files.get(StringUtil.normalizePath(path));
    if (content === undefined) throw new Error(`File not found in tree: ${path}`);
    return content;
  }

  write(path: string, content: string): void {
    this.files.set(StringUtil.normalizePath(path), content);
  }

  exists(path: string): boolean {
    return this.files.has(StringUtil.normalizePath(path));
  }

  delete(path: string): boolean {
    return this.files.delete(StringUtil.normalizePath(path));
  }

  paths(): string[] {
    return [...this.files.keys()];
  }

  // =============================================================================
  //                              DISK METHODS
  // =============================================================================

  /** Loads a directory recursively into the tree, skipping EXCLUDED_ENTRIES. */
  async fromTemplateDir(dir: string): Promise<void> {
    const root = resolve(dir);
    const walk = async (current: string): Promise<void> => {
      const entries = await fs.readdir(current, { withFileTypes: true });
      for (const entry of entries) {
        if (EXCLUDED_ENTRIES.includes(entry.name)) continue;
        const fullPath = join(current, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else {
          this.write(relative(root, fullPath), await fs.readFile(fullPath, "utf-8"));
        }
      }
    };
    await walk(root);
  }

  /**
   * The pipeline's single disk write: materializes every file under
   * targetDir. If any write fails, removes what was already written —
   * no half-written project is left behind.
   */
  async commit(targetDir: string): Promise<void> {
    const targetExistedBefore = existsSync(targetDir);

    try {
      for (const [path, content] of this.files) {
        const fullPath = join(targetDir, path);
        await fs.mkdir(dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, "utf-8");
      }
    } catch (err) {
      // On failure: delete everything that was written, no half-written project
      if (!targetExistedBefore) {
        await fs.rm(targetDir, { recursive: true, force: true });
      }
      const reason = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to write the project to ${targetDir}: ${reason}`);
    }
  }
}
