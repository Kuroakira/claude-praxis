export interface ConfidenceMetadata {
  count: number;
  lastConfirmed: string;
  phases: string[];
}

export interface FileConfidenceStats {
  totalEntries: number;
  confirmedEntries: number;
  unverifiedCount: number;
  avgConfirmed: number;
}

const CONFIRMED_RE =
  /^- \*\*Confirmed\*\*:\s*(\d+)回\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+)$/;

export function parseConfirmed(line: string): ConfidenceMetadata | null {
  const match = CONFIRMED_RE.exec(line.trim());
  if (!match) return null;

  const count = parseInt(match[1], 10);
  if (isNaN(count)) return null;

  const lastConfirmed = match[2];
  const phases = match[3].split(",").map((p) => p.trim()).filter(Boolean);

  return { count, lastConfirmed, phases };
}

export function formatConfirmed(meta: ConfidenceMetadata): string {
  return `- **Confirmed**: ${meta.count}回 | ${meta.lastConfirmed} | ${meta.phases.join(", ")}`;
}

export function createInitial(phase: string, date: string): ConfidenceMetadata {
  return { count: 1, lastConfirmed: date, phases: [phase] };
}

export function incrementConfirmed(
  existing: ConfidenceMetadata,
  phase: string,
  date: string,
): ConfidenceMetadata {
  const phases = existing.phases.includes(phase)
    ? [...existing.phases]
    : [...existing.phases, phase];
  return {
    count: existing.count + 1,
    lastConfirmed: date,
    phases,
  };
}

export function mergeConfirmed(
  entries: ConfidenceMetadata[],
): ConfidenceMetadata {
  if (entries.length === 0) {
    return { count: 0, lastConfirmed: "", phases: [] };
  }
  const totalCount = entries.reduce((sum, e) => sum + e.count, 0);
  const latestDate = entries
    .map((e) => e.lastConfirmed)
    .sort()
    .pop() ?? entries[0].lastConfirmed;
  const allPhases = [...new Set(entries.flatMap((e) => e.phases))];

  return { count: totalCount, lastConfirmed: latestDate, phases: allPhases };
}

export function parseFileConfidence(content: string): FileConfidenceStats {
  const lines = content.split("\n");
  const entryStarts: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      entryStarts.push(i);
    }
  }

  const totalEntries = entryStarts.length;
  if (totalEntries === 0) {
    return { totalEntries: 0, confirmedEntries: 0, unverifiedCount: 0, avgConfirmed: 0 };
  }

  let confirmedEntries = 0;
  let totalConfirmations = 0;

  for (let idx = 0; idx < entryStarts.length; idx++) {
    const start = entryStarts[idx];
    const end = idx + 1 < entryStarts.length ? entryStarts[idx + 1] : lines.length;

    for (let i = start + 1; i < end; i++) {
      const meta = parseConfirmed(lines[i]);
      if (meta) {
        confirmedEntries++;
        totalConfirmations += meta.count;
        break;
      }
    }
  }

  const unverifiedCount = totalEntries - confirmedEntries;
  const avgConfirmed = confirmedEntries > 0
    ? totalConfirmations / confirmedEntries
    : 0;

  return { totalEntries, confirmedEntries, unverifiedCount, avgConfirmed };
}
