import type { ARCHITECTURE_TYPE } from "../../config/choices";
import type { StepAction } from "../step.types";


export interface TemplateMeta {
  id: ARCHITECTURE_TYPE;
  repoUrl: string;
}

/** One entry per unit of work, run in order by template.step.ts. */
export interface TemplateAction extends StepAction {}
