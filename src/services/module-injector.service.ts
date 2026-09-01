import { IndentationText, Project, QuoteKind, SyntaxKind } from "ts-morph";

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

/** The file name is irrelevant in memory, but the parser wants one. */
const VIRTUAL_FILE = "source.ts";

/** The prisma config im template is built by this call, not by the first call of the file config() but the second defineConfig(). */
const DEFINE_CONFIG = "defineConfig";

/** Matches `app.listen(...)`, awaited or not — the last statement of bootstrap(). */
const LISTEN_CALL = /\.listen\s*\(/;

const createProject = (): Project =>
  new Project({
    useInMemoryFileSystem: true,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
      indentationText: IndentationText.TwoSpaces,
    },
  });

// =============================================================================
//                              SERVICE METHODS
// =============================================================================

/**
 * Edits the generated project's TypeScript through its syntax tree.
 *
 * Every method takes the source as a string and returns it as a string,
 * so the VirtualTree stays the single source of truth: read from the
 * tree, transform here, write back to the tree. 
 */
export class ModuleInjectorService {

  /** Adds the import and registers the module in the @Module imports array. */
  static addModuleImport(source: string, moduleImport: ModuleImport): string {
    const project = createProject();
    const file = project.createSourceFile(VIRTUAL_FILE, source);

    const existing = file.getImportDeclaration(
      (declaration) => declaration.getModuleSpecifierValue() === moduleImport.importPath
    );

    if (existing) {
      const alreadyImported = existing.getNamedImports().map((named) => named.getName());
      existing.addNamedImports(moduleImport.namedImports.filter((name) => !alreadyImported.includes(name)));
    } else {
      file.addImportDeclaration({
        moduleSpecifier: moduleImport.importPath,
        namedImports: moduleImport.namedImports,
      });
    }

    getModuleImportsArray(file).addElement(moduleImport.entry);

    return file.getFullText();
  }

  /** Adds an option to the object literal passed to defineConfig(). */
  static addPrismaConfigOption(source: string, name: string, value: string): string {
    const project = createProject();
    const file = project.createSourceFile(VIRTUAL_FILE, source);

    // The file also calls dotenv's config(): the call has to be found by name
    const call = file
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .find((candidate) => candidate.getExpression().getText() === DEFINE_CONFIG);

    if (!call) throw new Error(`No ${DEFINE_CONFIG}() call found in the prisma config.`);

    const options = call.getArguments()[0]?.asKind(SyntaxKind.ObjectLiteralExpression);

    if (!options) throw new Error(`${DEFINE_CONFIG}() was not given an options object.`);

    options.addPropertyAssignment({ name, initializer: value });

    return file.getFullText();
  }

  /** Registers a global pipe in main.ts, right before the app starts listening. */
  static addGlobalPipe(source: string, pipe: GlobalPipe): string {
    const project = createProject();
    const file = project.createSourceFile(VIRTUAL_FILE, source);

    const listen = findListenStatement(file);

    // Idempotent: a second run must not stack the same pipe twice
    const registration = `app.useGlobalPipes(${pipe.expression});`;
    if (file.getFullText().includes(registration)) return file.getFullText();

    const existing = file.getImportDeclaration(
      (declaration) => declaration.getModuleSpecifierValue() === pipe.importPath
    );

    if (existing) {
      const alreadyImported = existing.getNamedImports().map((named) => named.getName());
      existing.addNamedImports(pipe.namedImports.filter((name) => !alreadyImported.includes(name)));
    } else {
      file.addImportDeclaration({
        moduleSpecifier: pipe.importPath,
        namedImports: pipe.namedImports,
      });
    }

    const block = listen.getParentIfKindOrThrow(SyntaxKind.Block);
    block.insertStatements(block.getStatements().indexOf(listen), registration);

    return file.getFullText();
  }
}

// =============================================================================
//                              AST NAVIGATION
// =============================================================================

/** The `await app.listen(...)` statement of the bootstrap function. */
const findListenStatement = (file: ReturnType<Project["createSourceFile"]>) => {
  const statement = file
    .getDescendantsOfKind(SyntaxKind.ExpressionStatement)
    .find((candidate) => LISTEN_CALL.test(candidate.getText()));

  if (!statement) throw new Error("No app.listen() call found in the bootstrap file.");

  return statement;
};

/** The `imports: [...]` of the first @Module decorator of the file. */
const getModuleImportsArray = (file: ReturnType<Project["createSourceFile"]>) => {
  const decorator = file
    .getClasses()
    .flatMap((declaration) => declaration.getDecorators())
    .find((candidate) => candidate.getName() === "Module");

  if (!decorator) throw new Error("No @Module decorator found in the source file.");

  const options = decorator.getArguments()[0]?.asKind(SyntaxKind.ObjectLiteralExpression);

  if (!options) throw new Error("The @Module decorator was not given an options object.");

  const property = options.getProperty("imports")?.asKind(SyntaxKind.PropertyAssignment)
    ?? options.addPropertyAssignment({ name: "imports", initializer: "[]" });

  return property.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression);
};
