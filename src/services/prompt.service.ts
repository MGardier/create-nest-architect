import prompts, { PromptType } from "prompts";


export interface AskChoiceInterface<T extends string = string> {
  title: string;
  value: T;
}

// =============================================================================
//                              SERVICE METHODS
// =============================================================================

export  class PromptService {
  /** The name every answer is stored under */
  private static readonly FIELD = "answer";

  static async askUser(
    question: string,
    type: PromptType
  ): Promise<string | undefined> {
    const answer = await prompts({
      type,
      message: question,
      name: this.FIELD,
    });

    // empty object = user cancels (Ctrl+C / Esc)
    if(Object.keys(answer).length < 1)
      return undefined

    return answer[this.FIELD] as string;
  }

  static async askUserWithChoices<T extends string>(
    question: string,
    choices: AskChoiceInterface<T>[],
    type: PromptType
  ): Promise<T | undefined> {
    const answer = await prompts({
      type,
      message: question,
      name: this.FIELD,
      choices,
    });

    // empty object = user cancels (Ctrl+C / Esc)
    if(Object.keys(answer).length < 1)
      return undefined

    return answer[this.FIELD] as T;
  }
}
