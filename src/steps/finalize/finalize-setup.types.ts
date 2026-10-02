import type { StepAction } from "../step.types";

/** One entry per unit of work, run in order by finalize.step.ts. */
export interface FinalizeAction extends StepAction {}
