import { ARCHITECTURE_TYPE, DATABASE, PACKAGER_TYPE } from "./choices";
import { IPackagerCommands } from "../constants/packager.constants";



// =============================================================================
//                              CONFIG
// =============================================================================

/**
 * The configuration being collected: plain data, filled question by
 * question by the accumulator loop.
 */
export interface ConfigData {
  projectName: string;
  packagerType: PACKAGER_TYPE;
  architectureType: ARCHITECTURE_TYPE;
  database: DATABASE;
  orm: string;
}

/**
 * The starting configuration.
 */
export type PartialConfig = Partial<ConfigData>;

/**
 * The validated configuration.
 */
export type ConfigChoice = Readonly<ConfigData & { packager: IPackagerCommands }>;



// =============================================================================
//                              QUESTIONS
// =============================================================================


type ConfigField = keyof ConfigData;

type AnswerFor<Field extends ConfigField> = ConfigData[Field] | undefined;

type QuestionFilling<Field extends ConfigField> = {
  id: Field;
  when?: (config: PartialConfig) => boolean;
  ask: (config: PartialConfig) => Promise<AnswerFor<Field>>;
};

type QuestionByField = {
  [Field in ConfigField]: QuestionFilling<Field>;
};

export type Question = QuestionByField[ConfigField];

