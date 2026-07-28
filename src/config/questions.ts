import { MessageUtil } from "../utils/message.util";
import { PromptUtil } from "../services/prompt";
import { ormsForDatabase } from "../steps/orm/registry";
import {
  ARCHITECTURE_CHOICES,
  DATABASE_CHOICES,
  PACKAGER_CHOICES,
} from "./choices";
import { ConfigChoice, ConfigData, PartialConfig } from "./config.types";
import { validateConfig } from "./validate";

/**
 * The collect sequence as data: one entry per user decision, asked in
 * order. A question is skipped when its id is already filled in the
 * accumulated config or when its `when` condition returns false.
 */
interface Question {
  id: keyof ConfigData;
  when?: (config: PartialConfig) => boolean;
  ask: (config: PartialConfig) => Promise<unknown>;
}


// =============================================================================
//                              ASK METHODS
// =============================================================================

const askProjectName = async (): Promise<unknown> => {
  const { answer } = await PromptUtil.askUser(
    "Please specify a project name",
    "text",
    "answer"
  );
  return answer;
};

const askPackager = async (): Promise<unknown> => {
  const { answer } = await PromptUtil.askUserWithChoices(
    "Which package manager would you like to use?",
    PACKAGER_CHOICES,
    "select",
    "answer"
  );
  return answer;
};

const askArchitecture = async (): Promise<unknown> => {
  const { answer } = await PromptUtil.askUserWithChoices(
    `Choose your project architecture:`,
    ARCHITECTURE_CHOICES,
    "select",
    "answer"
  );
  return answer;
};

const askDatabase = async (): Promise<unknown> => {
  const { answer } = await PromptUtil.askUserWithChoices(
    "Which database will your project use?",
    DATABASE_CHOICES,
    "select",
    "answer"
  );
  return answer;
};

const askOrm = async (config: PartialConfig): Promise<unknown> => {
  // The registry is the source of truth: only compatible installers are offered
  const compatible = ormsForDatabase(config.database!);

  if (compatible.length === 1) {
    MessageUtil.info(`→ ${compatible[0].label.trim()} (only option for this database)`);
    return compatible[0].id;
  }

  const { answer } = await PromptUtil.askUserWithChoices(
    "Which ORM/ODM would you like to set up?",
    compatible.map((installer) => ({ title: installer.label, value: installer.id })),
    "select",
    "answer"
  );
  return answer;
};

// =============================================================================
//                              QUESTIONS
// =============================================================================

const questions: Question[] = [
  { id: "projectName", ask: askProjectName },
  { id: "packagerType", ask: askPackager },
  { id: "architectureType", ask: askArchitecture },
  { id: "database", ask: askDatabase },
  { id: "orm", ask: askOrm },
];


// =============================================================================
//                        ACCUMULATOR LOOP
// =============================================================================

export const collectConfig = async (
  initial: PartialConfig = {}
): Promise<ConfigChoice> => {
  const config: PartialConfig = { ...initial };

  for (const question of questions) {
    if (config[question.id] !== undefined) continue;
    if (question.when && !question.when(config)) continue;

    const answer = await question.ask(config);

    // prompts returns an object without the answer key on cancellation (Ctrl+C / Esc)
    if (answer === undefined) {
      MessageUtil.error("Aborted, nothing was created.");
      process.exit(1);
    }

    config[question.id] = answer as never;
  }

  return validateConfig(config);
};
