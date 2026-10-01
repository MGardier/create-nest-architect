/** A parsed JSON file. */
type JsonObject = Record<string, unknown>;

export abstract class FsUtil {

// =============================================================================
//                             PROJECT NAME  METHOD
// =============================================================================

  static extractProjectNameFromPath(projectName: string): string {
    if (projectName.includes('/') || projectName.includes('\\')) {
      const segments = projectName.split(/[/\\]/);
      return segments[segments.length - 1];
    }
    return projectName;
  }

  static updateProjectNameInPackageJson(content: string, projectName: string,): string {
    return FsUtil.setJsonValue(content, "name", FsUtil.extractProjectNameFromPath(projectName));
  }

// =============================================================================
//                             JSON  METHODS
// =============================================================================

  /** `path` is dotted: "type", or "compilerOptions.types" for a nested key. */

  /** Writes the value at `path`, replacing whatever was there. */
  static setJsonValue(content: string, path: string, value: unknown): string {
    const root = FsUtil.parseJson(content);
    const { holder, key } = FsUtil.reachKeyHolder(root, path);

    holder[key] = value;

    return FsUtil.stringifyJson(root);
  }

  /** Adds the given entries to the object at `path`, keeping the ones already there. */
  static mergeJsonValues(content: string, path: string, entries: JsonObject): string {
    const root = FsUtil.parseJson(content);
    const { holder, key } = FsUtil.reachKeyHolder(root, path);

    holder[key] = { ...(holder[key] as JsonObject), ...entries };

    return FsUtil.stringifyJson(root);
  }

  /** Deletes the key at `path`, and does nothing when it is already absent. */
  static removeJsonValue(content: string, path: string): string {
    const root = FsUtil.parseJson(content);
    const { holder, key } = FsUtil.reachKeyHolder(root, path);

    delete holder[key];

    return FsUtil.stringifyJson(root);
  }

  /** Sorts the keys of the object at `path`, the way a packager writes them. */
  static sortJsonKeys(content: string, path: string): string {
    const root = FsUtil.parseJson(content);
    const { holder, key } = FsUtil.reachKeyHolder(root, path);

    const sorted = Object.entries(holder[key] as JsonObject)
      .sort(([left], [right]) => left.localeCompare(right));

    holder[key] = Object.fromEntries(sorted);

    return FsUtil.stringifyJson(root);
  }

// =============================================================================
//                             JSON  NAVIGATION
// =============================================================================

  /** "compilerOptions.types" returns the compilerOptions object and the key "types". */
  private static reachKeyHolder(root: JsonObject, path: string): { holder: JsonObject; key: string } {
    const segments = path.split(".");
    const key = segments.pop();

    if (!key) throw new Error(`"${path}" is not a usable JSON path.`);

    let holder = root;

    for (const segment of segments) {
      holder[segment] ??= {};
      holder = holder[segment] as JsonObject;
    }

    return { holder, key };
  }

  private static parseJson(content: string): JsonObject {
    return JSON.parse(content) as JsonObject;
  }

  /** Two spaces and a trailing newline, as packagers write it. */
  private static stringifyJson(content: unknown): string {
    return `${JSON.stringify(content, null, 2)}\n`;
  }

}
