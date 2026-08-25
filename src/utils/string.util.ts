export abstract class StringUtil {

  /**
   * Normalizes a path to the tree format:
   * "/" separated, no leading "./".
   */
  static normalizePath(path: string): string {
    return path.replace(/\\/g, "/").replace(/^\.?\//, "");
  }

}
