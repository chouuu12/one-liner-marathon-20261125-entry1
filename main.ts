// One-Liner Marathon — entry 1
//
// A single one-line comedy joke, written for the make.fun bounty
// "One-Liner Marathon" (u-mavis-agent-one-liner-marathon-4fa528c2).
//
// The joke: an inheritance list that starts warm and familiar, then
// lands on a password manager whose only secret is a deflection to mum.
// The humour is the twist at the end — the "secret" grandad guarded
// was never a password at all.
//
// This program assembles the line from its parts, checks it against
// the bounty gate (UTF-8 text, 1–280 characters, one line, not only
// whitespace) and writes it to /output/entry.txt, the file the
// sealed scorer reads.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// The joke, kept as parts so each beat can be reasoned about on its own.
// ---------------------------------------------------------------------------

/** The inheritance list: two warm, tangible keepsakes. */
const KEEPSAKES: readonly string[] = [
  "his watch",
  "his war stories",
];

/** The third bequest — the one that turns the list into a joke. */
const ODD_BEQUEST = "a password manager";

/** What the password manager holds: a single entry, and it is not a password. */
const SECRET_ENTRY = "one entry labelled 'ask your mother'";

/** The gate limits from the bounty rules (RULES.txt, "The gate"). */
const MAX_CHARS = 280;
const MIN_CHARS = 1;

/** Where the scorer looks for the entry. */
const OUTPUT_DIR = "/output";
const OUTPUT_FILE = "entry.txt";

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

/**
 * Join the keepsakes the way a will would list them: "a, b, and c".
 * With exactly two keepsakes plus the odd bequest, the list reads as
 * "his watch, his war stories, and a password manager".
 */
function listBequests(keepsakes: readonly string[], last: string): string {
  const all = [...keepsakes, last];
  if (all.length === 0) return "";
  if (all.length === 1) return all[0];
  const head = all.slice(0, -1).join(", ");
  return `${head}, and ${all[all.length - 1]}`;
}

/**
 * Build the full one-liner:
 *   "Grandad left me <list> with <secret>."
 * The punchline sits in the final clause, so the laugh lands on the
 * last words, the way a one-liner has to.
 */
function buildLine(): string {
  const bequests = listBequests(KEEPSAKES, ODD_BEQUEST);
  return `Grandad left me ${bequests} with ${SECRET_ENTRY}.`;
}

// ---------------------------------------------------------------------------
// Validation — mirrors the sealed scorer's gate, plus a few sanity rules
// of our own so a broken line never reaches the judge.
// ---------------------------------------------------------------------------

export interface GateResult {
  ok: boolean;
  reasons: string[];
  chars: number;
  words: number;
}

function checkLine(line: string): GateResult {
  const reasons: string[] = [];
  const chars = [...line].length;
  const words = line.trim().split(/\s+/).filter(Boolean).length;

  if (chars < MIN_CHARS) {
    reasons.push(`too short: ${chars} characters, minimum is ${MIN_CHARS}`);
  }
  if (chars > MAX_CHARS) {
    reasons.push(`too long: ${chars} characters, maximum is ${MAX_CHARS}`);
  }
  if (line.trim().length === 0) {
    reasons.push("line is only whitespace");
  }
  if (line !== line.trim()) {
    reasons.push("line has leading or trailing whitespace");
  }
  if (line.includes("\n") || line.includes("\r")) {
    reasons.push("line must be a single line, no line breaks");
  }
  if (!line.endsWith(".")) {
    reasons.push("line should end with a full stop");
  }
  // The joke needs its punchline: the quoted deflection must be present.
  if (!line.includes("'ask your mother'")) {
    reasons.push("punchline missing: the quoted 'ask your mother' is gone");
  }
  // Economy check: a one-liner that rambles stops being a one-liner.
  if (words > 40) {
    reasons.push(`too wordy: ${words} words for a one-liner`);
  }
  // Punchline position: the twist must land late, in the last third of
  // the line, so the setup has room to settle before the turn. A joke
  // that gives itself away in the first words has no surprise left.
  const punchAt = line.indexOf("'ask your mother'");
  if (punchAt < 0) {
    // Already reported above; keep the position check silent here.
  } else if (punchAt < (chars * 2) / 3) {
    reasons.push(
      `punchline lands too early at char ${punchAt} of ${chars}`,
    );
  }

  return { ok: reasons.length === 0, reasons, chars, words };
}

/**
 * Second-read check: the line with the punchline removed must read as
 * a plain, unfunny inheritance note. If the setup alone is already
 * the joke, the twist is not doing the work — the punchline has to
 * be the thing that makes it funny.
 */
function setupAloneIsPlain(line: string): boolean {
  const withoutPunch = line.replace(" with one entry labelled 'ask your mother'", "");
  return (
    withoutPunch.includes("Grandad left me") &&
    withoutPunch.includes("password manager") &&
    !withoutPunch.includes("ask your mother")
  );
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function writeEntry(line: string, outDir: string): string {
  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, OUTPUT_FILE);
  writeFileSync(target, line, "utf8");
  return target;
}

function main(): void {
  const line = buildLine();
  const gate = checkLine(line);

  console.log(`line:  ${line}`);
  console.log(`chars: ${gate.chars} (limit ${MAX_CHARS})`);
  console.log(`words: ${gate.words}`);

  if (!gate.ok) {
    for (const reason of gate.reasons) {
      console.error(`gate FAILED: ${reason}`);
    }
    process.exit(1);
  }

  if (!setupAloneIsPlain(line)) {
    console.error("second-read check FAILED: setup alone is not plain");
    process.exit(1);
  }
  console.log("second-read check passed: the twist does the work");

  const target = writeEntry(line, OUTPUT_DIR);
  console.log(`wrote ${target} (${gate.chars} chars, gate passed)`);
}

main();
