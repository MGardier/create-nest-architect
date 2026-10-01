import { MODULE_SYSTEM } from "../../config/choices";
import { ConfigChoice } from "../../config/config.types";
import { ModuleInjectorService } from "../../services/module-injector/module-injector.service";
import { JS_EXTENSION } from "../../services/module-injector/module-injector.types";
import { readTemplate } from "../orm/orm-setup.types";

/** Templates ship in ESM: this is the only place that adapts them to CommonJS. */

const isCommonJs = (config: ConfigChoice): boolean =>
  config.moduleSystem === MODULE_SYSTEM.CJS;

/** Reads a template, stripping the .js of its relative imports when the project is CommonJS. */
export const readTemplateFor = async (config: ConfigChoice, templatePath: string): Promise<string> => {
  const template = await readTemplate(templatePath);

  if (!isCommonJs(config)) return template;

  return ModuleInjectorService.removeJsExtensionFromRelativeImports(template);
};

/** The specifier to import `modulePath` with, extension excluded: .js in ESM, nothing in CommonJS. */
export const importPathFor = (config: ConfigChoice, modulePath: string): string =>
  isCommonJs(config) ? modulePath : `${modulePath}${JS_EXTENSION}`;
