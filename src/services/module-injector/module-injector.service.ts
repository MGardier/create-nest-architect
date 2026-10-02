import {
  ArrayLiteralExpression,
  AwaitExpression,
  ExpressionStatement,
  IndentationText,
  Project,
  QuoteKind,
  SourceFile,
  SyntaxKind,
} from "ts-morph";
import {
  DEFINE_CONFIG,
  GlobalPipe,
  JS_EXTENSION,
  LISTEN_CALL,
  ModuleImport,
  VIRTUAL_FILE,
} from "./module-injector.types";


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

    ensureNamedImports(file, moduleImport.importPath, moduleImport.namedImports);

    getModuleImportsArray(file).addElement(moduleImport.entry);

    return file.getFullText();
  }

  /** Adds an option to the object literal passed to defineConfig(). */
  static addPrismaConfigOption(source: string, name: string, value: string): string {
    const project = createProject();
    const file = project.createSourceFile(VIRTUAL_FILE, source);

    const options = findDefineConfigOptions(file);

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

    ensureNamedImports(file, pipe.importPath, pipe.namedImports);

    const block = listen.getParentIfKindOrThrow(SyntaxKind.Block);
    block.insertStatements(block.getStatements().indexOf(listen), registration);

    return file.getFullText();
  }

  /** `from './user.entity.js'` becomes `from './user.entity'`. Packages are left alone. */
  static removeJsExtensionFromRelativeImports(source: string): string {
    const project = createProject();
    const file = project.createSourceFile(VIRTUAL_FILE, source);

    for (const declaration of [...file.getImportDeclarations(), ...file.getExportDeclarations()]) {
      const specifier = declaration.getModuleSpecifierValue();

      if (!isRelativeJsPath(specifier)) continue;

      declaration.setModuleSpecifier(withoutJsExtension(specifier));
    }

    return file.getFullText();
  }

  /** `await bootstrap();` becomes `bootstrap();` — CommonJS forbids a top-level await. */
  static removeAwaitFromTopLevelCalls(source: string): string {
    const project = createProject();
    const file = project.createSourceFile(VIRTUAL_FILE, source);

    let topLevelAwait = findTopLevelAwait(file);

    while (topLevelAwait) {
      const callWithoutAwait = topLevelAwait.getExpression().getText();

      topLevelAwait.replaceWithText(callWithoutAwait);

      // The rewrite invalidates the nodes around it: search the file again
      topLevelAwait = findTopLevelAwait(file);
    }

    return file.getFullText();
  }
}

// =============================================================================
//                              AST EDITION
// =============================================================================

/** Merges into the import the file already has for that path: importing a name twice is a syntax error. */
const ensureNamedImports = (file: SourceFile, importPath: string, namedImports: string[]): void => {
  const existing = file.getImportDeclaration(
    (declaration) => declaration.getModuleSpecifierValue() === importPath
  );

  if (!existing) {
    file.addImportDeclaration({ moduleSpecifier: importPath, namedImports });
    return;
  }

  const alreadyImported = existing.getNamedImports().map((named) => named.getName());

  existing.addNamedImports(namedImports.filter((name) => !alreadyImported.includes(name)));
};

// =============================================================================
//                              AST NAVIGATION
// =============================================================================

/** A path of the project itself, written the ESM way — never a package of node_modules. */
const isRelativeJsPath = (specifier: string | undefined): specifier is string =>
  !!specifier?.startsWith(".") && specifier.endsWith(JS_EXTENSION);

const withoutJsExtension = (specifier: string): string =>
  specifier.slice(0, -JS_EXTENSION.length);

/** The `await app.listen(...)` statement of the bootstrap function. */
const findListenStatement = (file: SourceFile): ExpressionStatement => {
  const statement = file
    .getDescendantsOfKind(SyntaxKind.ExpressionStatement)
    .find((candidate) => LISTEN_CALL.test(candidate.getText()));

  if (!statement) throw new Error("No app.listen() call found in the bootstrap file.");

  return statement;
};

/** The first `await …` of a statement sitting directly at the root of the file. */
const findTopLevelAwait = (file: SourceFile): AwaitExpression | undefined => {
  for (const statement of file.getStatements()) {
    const awaited = statement
      .asKind(SyntaxKind.ExpressionStatement)
      ?.getExpression()
      .asKind(SyntaxKind.AwaitExpression);

    if (awaited) return awaited;
  }

  return undefined;
};

/** The options object of the prisma config, i.e. the argument of defineConfig(). */
const findDefineConfigOptions = (file: SourceFile) => {
  // Found by name: the file holds other calls, such as env()
  const call = file
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((candidate) => candidate.getExpression().getText() === DEFINE_CONFIG);

  if (!call) throw new Error(`No ${DEFINE_CONFIG}() call found in the prisma config.`);

  const options = call.getArguments()[0]?.asKind(SyntaxKind.ObjectLiteralExpression);

  if (!options) throw new Error(`${DEFINE_CONFIG}() was not given an options object.`);

  return options;
};

/** The `imports: [...]` of the first @Module decorator of the file. */
const getModuleImportsArray = (file: SourceFile): ArrayLiteralExpression => {
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
