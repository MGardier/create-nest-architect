import prompts, { PromptType } from "prompts";

export interface AskChoiceInterface {
  title: string;
  value: string;
}

// =============================================================================
//                            GENERIC METHODS
// =============================================================================

export abstract class PromptUtil {
  static async askUser(
    question: string,
    type: PromptType,
    field: string
  ): Promise<Record<string, string>> {
    const answer = await prompts({
      type,
      message: question,
      name: field,
    });

    return answer;
  }

  static async askUserWithChoices(
    question: string,
    choices: AskChoiceInterface[],
    type: PromptType,
    field: string
  ): Promise<Record<string, string>> {
    const answer = await prompts({
      type,
      message: question,
      name: field,
      choices,
    });

    return answer;
  }
}
