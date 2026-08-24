import { MessageUtil } from "../utils/message.util";
import { PackagerFactory } from "../constants/packager.constants";
import { findOrmInstaller, ORM_INSTALLERS } from "../steps/orm/registry";
import { DATABASE_META } from "./choices";
import { ConfigChoice, ConfigData, PartialConfig, Validation } from "./config.types";


// =============================================================================
//                              VALIDATION METHODS
// =============================================================================

const hasProjectName = (config: PartialConfig): boolean => !!config.projectName;

const hasPackagerType = (config: PartialConfig): boolean => !!config.packagerType;

const hasArchitectureType = (config: PartialConfig): boolean => !!config.architectureType;

const hasDatabase = (config: PartialConfig): boolean => !!config.database;

const hasOrm = (config: PartialConfig): boolean => !!config.orm;

const isKnownOrm = (config: PartialConfig): boolean =>
  !!findOrmInstaller(config.orm ?? "");

const isOrmCompatibleWithDatabase = (config: PartialConfig): boolean => {
  const installer = findOrmInstaller(config.orm ?? "");
  return !!installer && !!config.database && installer.supportedDatabases.includes(config.database);
};


// =============================================================================
//                              VALIDATIONS
// =============================================================================

const validations: Validation[] = [
  { check: hasProjectName, message: () => "You must specify a name to create project." },
  { check: hasPackagerType, message: () => "You must choose a package manager." },
  { check: hasArchitectureType, message: () => "You must choose an architecture." },
  { check: hasDatabase, message: () => "You must choose a database." },
  { check: hasOrm, message: () => "You must choose an Orm or Odm." },
  {
    check: isKnownOrm,
    message: (config) =>
      `Unknown ORM "${config.orm}". Available: ${ORM_INSTALLERS.map((installer) => installer.id).join(", ")}`,
  },
  {
    check: isOrmCompatibleWithDatabase,
    message: (config) => {
      const installer = findOrmInstaller(config.orm ?? "")!;
      const databaseLabel = config.database
        ? DATABASE_META[config.database]?.label.trim() ?? config.database
        : String(config.database);
      return `${installer.label.trim()} does not support ${databaseLabel}. ` +
        `Compatible: ${installer.supportedDatabases.join(", ")}`;
    },
  },
];


// =============================================================================
//                              VALIDATION LOOP
// =============================================================================

export const validateConfig = (partial: PartialConfig): ConfigChoice => {
  for (const validation of validations) {
    if (!validation.check(partial)) {
      MessageUtil.error(validation.message(partial));
      process.exit(1);
    }
  }

  // Every field was checked by the loop above, the partial is complete
  // and the orm/database pair is supported by the registry
  const config = partial as ConfigData;

  return {
    ...config,
    packager: PackagerFactory.getCommands(config.packagerType),
  };
};
