import prompts, { PromptType } from "prompts";

export class UtilPrompt {
  static async askUser(
    question: string,
    type: PromptType,
    field: string
  ): Promise<Record<any, string>> {
    const answer = await prompts({
      type,
      message: question,
      name: field,
    });

    return answer;
  }

  static async askProjectNameIfNeeded(): Promise<string> {
    let projectName = process.argv[2];
    if (!projectName) {
      const { answer } = await this.askUser(
        "Please specify a project name",
        "text",
        "answer"
      );
      projectName = answer;
    }

    return projectName;
  }
}
