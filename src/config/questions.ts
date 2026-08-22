import { MessageUtil } from "../utils/message.util";
import { PromptService } from "../services/prompt.service";
import { ormsForDatabase } from "../steps/orm/registry";
import {
  ARCHITECTURE_CHOICES,
  ARCHITECTURE_TYPE,
  DATABASE,
  DATABASE_CHOICES,
  PACKAGER_CHOICES,
  PACKAGER_TYPE,
} from "./choices";
import { PartialConfig } from "./config.types";



// =============================================================================
//                              ASK METHODS
// =============================================================================

export const askProjectName = async (): Promise<string | undefined> => {
  return PromptService.askUser("Please specify a project name", "text");
};

export const askPackager = async (): Promise<PACKAGER_TYPE | undefined> => {
  return PromptService.askUserWithChoices(
    "Which package manager would you like to use?",
    PACKAGER_CHOICES,
    "select"
  );
};

export const askArchitecture = async (): Promise<ARCHITECTURE_TYPE | undefined> => {
  return PromptService.askUserWithChoices(
    `Choose your project architecture:`,
    ARCHITECTURE_CHOICES,
    "select"
  );
};

export const askDatabase = async (): Promise<DATABASE | undefined> => {
  return PromptService.askUserWithChoices(
    "Which database will your project use?",
    DATABASE_CHOICES,
    "select"
  );
};

export const askOrm = async (config: PartialConfig): Promise<string | undefined> => {
  // The registry is the source of truth: only compatible installers are offered
  const compatible = ormsForDatabase(config.database!);

  if (compatible.length === 1) {
    MessageUtil.info(`→ ${compatible[0].label.trim()} (only option for this database)`);
    return compatible[0].id;
  }

  return PromptService.askUserWithChoices(
    "Which ORM/ODM would you like to set up?",
    compatible.map((installer) => ({ title: installer.label, value: installer.id })),
    "select"
  );
};
