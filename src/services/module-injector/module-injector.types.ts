// =============================================================================
//                              TYPES
// =============================================================================

/** What it takes to plug a module into a NestJS @Module decorator. */
export interface ModuleImport {

  importPath: string;
  namedImports: string[];
  entry: string;
}

/** What it takes to register a global pipe in the bootstrap function. */
export interface GlobalPipe {

  importPath: string;
  namedImports: string[];

  /** The instantiation itself, e.g. `new ValidationPipe({ whitelist: true })` */
  expression: string;
}

// =============================================================================
//                              CONSTANTS
// =============================================================================

/** The file name is irrelevant in memory, but the parser wants one. */
export const VIRTUAL_FILE = "source.ts";

/** The prisma config im template is built by this call, not by the first call of the file config() but the second defineConfig(). */
export const DEFINE_CONFIG = "defineConfig";

/** Matches `app.listen(...)`, awaited or not — the last statement of bootstrap(). */
export const LISTEN_CALL = /\.listen\s*\(/;

/** The extension ESM requires on its relative imports, and CommonJS does not use. */
export const JS_EXTENSION = ".js";
