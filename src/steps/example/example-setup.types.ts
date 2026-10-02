import type { StepAction } from "../step.types";

/** One entry per unit of work, run in order by example.step.ts. */
export interface ExampleAction extends StepAction {}
