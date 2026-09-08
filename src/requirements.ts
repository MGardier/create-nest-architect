import { CommandService } from "./services/command.service";
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

export const SUPPORTED_NODE_VERSIONS: Readonly<Version[]> = [
  { major: 20, minor: 19 },
  { major: 22, minor: 12 },
  { major: 24, minor: 0 },
];

const LOWEST_OPEN_ENDED_VERSION = SUPPORTED_NODE_VERSIONS[SUPPORTED_NODE_VERSIONS.length - 1];

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

/** Supported = at or above the last line, or inside one of the others. */
const isSupported = (version: Version): boolean =>
  isAtLeast(version, LOWEST_OPEN_ENDED_VERSION) ||
  SUPPORTED_NODE_VERSIONS.some(
    (supported) => version.major === supported.major && version.minor >= supported.minor
  );

/** The same ranges as package.json "engines", rebuilt from the constant. */
const supportedNodeRange = (): string =>
  SUPPORTED_NODE_VERSIONS
    .map((version, index) =>
      index === SUPPORTED_NODE_VERSIONS.length - 1
        ? `>=${version.major}`
        : `^${version.major}.${version.minor}`
    )
    .join(" || ");


// =============================================================================
//                            REQUIREMENT METHODS
// =============================================================================

const hasSupportedNode = async (): Promise<boolean> =>
  isSupported(toVersion(process.versions.node));

/** The template is fetched with `git clone` (steps/load-template.step.ts). */
const hasGit = async (): Promise<boolean> =>
  CommandService.isAvailable("git --version");


// =============================================================================
//                              REQUIREMENTS
// =============================================================================

const REQUIREMENTS: Readonly<Requirement[]> = [
  {
    check: hasSupportedNode,
    message: () => `Node ${process.versions.node} detected, requires ${supportedNodeRange()}`,
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
