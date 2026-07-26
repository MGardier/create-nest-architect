import { ConfigChoice } from "../classes/configChoice.class";
import { MessageUtil } from "../utils/message.util";
import { ODM_TYPE, ORM_TYPE } from "./choices";
import { ConfigData, PartialConfig } from "./config.types";

/**
 * The validation sequence as data, mirroring questions.ts: one entry
 * per rule, checked in order. All validation happens here, before any
 * side effect. The first failing rule prints its message and exits.
 */
interface Validation {
  check: (config: PartialConfig) => boolean;
  message: (config: PartialConfig) => string;
}


// =============================================================================
//                              CHECK METHODS
// =============================================================================

const hasProjectName = (config: PartialConfig): boolean => !!config.projectName;

const hasPackagerType = (config: PartialConfig): boolean => !!config.packagerType;

const hasArchitectureType = (config: PartialConfig): boolean => !!config.architectureType;

const hasDbLanguage = (config: PartialConfig): boolean => !!config.dbLanguage;

const hasOrmOrOdm = (config: PartialConfig): boolean => !!config.ormOrOdm;

const SUPPORTED_ORM_OR_ODM: string[] = [ORM_TYPE.PRISMA, ODM_TYPE.MONGOOSE];

const isSupportedOrmOrOdm = (config: PartialConfig): boolean =>
  SUPPORTED_ORM_OR_ODM.includes(config.ormOrOdm as string);


// =============================================================================
//                              VALIDATIONS
// =============================================================================

const validations: Validation[] = [
  { check: hasProjectName, message: () => "You must specify a name to create project." },
  { check: hasPackagerType, message: () => "You must choose a package manager." },
  { check: hasArchitectureType, message: () => "You must choose an architecture." },
  { check: hasDbLanguage, message: () => "You must choose a db language." },
  { check: hasOrmOrOdm, message: () => "You must choose an Orm or Odm." },
  { check: isSupportedOrmOrOdm, message: (config) => `Unsupported ORM/ODM type: ${config.ormOrOdm}` },
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
  const config = partial as ConfigData;

  return new ConfigChoice(
    config.projectName,
    config.packagerType,
    config.architectureType,
    config.dbLanguage,
    config.ormOrOdm
  );
};
