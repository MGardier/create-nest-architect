import { exec as execCb } from "child_process";
import { promisify } from "util";
import { MessageUtil } from "./utils/message.util";


/**
 * A prerequisite of the CLI itself
 * one entry per thing the environment must provide..
 */
export interface Requirement {
  check: () => Promise<boolean>;
  message: () => string;
}


interface Version {
  major: number;
  minor: number;
}

// =============================================================================
//                           SUPPORTED NODE VERSION
// =============================================================================

export const MINIMUM_NODE_VERSION = "24.0";

// =============================================================================
//                              VERSION MATCHING
// =============================================================================

const toVersion = (value: string): Version => {
  const [major, minor] = value.split(".").map(Number);
  return { major, minor: minor ?? 0 };
};

const isAtLeast = (version: Version, minimum: Version): boolean =>
  version.major > minimum.major ||
  (version.major === minimum.major && version.minor >= minimum.minor);


// =============================================================================
//                            REQUIREMENT METHODS
// =============================================================================

const exec = promisify(execCb);

const hasSupportedNode = async (): Promise<boolean> =>
  isAtLeast(toVersion(process.versions.node), toVersion(MINIMUM_NODE_VERSION));

/** The template is fetched with `git clone` (steps/load-template.step.ts). */
const hasGit = async (): Promise<boolean> => {
  try {
    await exec("git --version");
    return true;
  } catch {
    return false;
  }
};


// =============================================================================
//                              REQUIREMENTS
// =============================================================================

const REQUIREMENTS: Readonly<Requirement[]> = [
  {
    check: hasSupportedNode,
    message: () => `Node >=${MINIMUM_NODE_VERSION} is required, found v${process.versions.node}.`,
  },
  {
    check: hasGit,
    message: () => "Git is required to fetch the project template, but no git executable was found.",
  },
];


// =============================================================================
//                        ACCUMULATOR LOOP
// =============================================================================

/**
 * Runs every requirement before anything else happens. The first
 * unsatisfied one stops the CLI with its own message — no question
 * asked, no directory created.
 */
export const validateRequirements = async (): Promise<void> => {
  for (const requirement of REQUIREMENTS) {

    if (!(await requirement.check())) {
      MessageUtil.error(requirement.message());
      process.exit(1);
    }
  }
};
