import type { StepAction } from "../step.types";

/** One entry per unit of work, run in order by database.step.ts. */
export interface DatabaseAction extends StepAction {}
