const BULLET_PATTERN = /^[•●\-]\s*/;
const FORMAT_LINE_PATTERN = /^\[.+\]$/;
const EMOJI_START_PATTERN = /^[^\w\s]/u;

function isSectionHeading(line: string) {
  if (line.length > 72 || BULLET_PATTERN.test(line)) return false;

  return (
    /(sessions|format|policy|how to pay)/i.test(line) ||
    (/[?？]$/.test(line) && EMOJI_START_PATTERN.test(line))
  );
}

function isCallout(line: string) {
  return (
    /^‼️/.test(line) ||
    /upload payment proof|strictly required/i.test(line)
  );
}

function isFormatLabel(line: string) {
  return /^please follow format:/i.test(line);
}

function renderLine(line: string, key: string) {
  if (FORMAT_LINE_PATTERN.test(line)) {
    return (
      <p
        key={key}
        className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-zinc-200"
      >
        {line}
      </p>
    );
  }

  if (isFormatLabel(line)) {
    return (
      <p
        key={key}
        className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
      >
        {line}
      </p>
    );
  }

  if (isSectionHeading(line)) {
    return (
      <p key={key} className="font-medium text-zinc-100">
        {line}
      </p>
    );
  }

  if (isCallout(line)) {
    return (
      <p
        key={key}
        className="rounded-md border border-jackals-red/20 bg-jackals-red/5 px-3 py-2.5 text-zinc-200"
      >
        {line}
      </p>
    );
  }

  if (BULLET_PATTERN.test(line) || line.startsWith("•")) {
    return (
      <div key={key} className="flex gap-2.5">
        <span className="mt-0.5 shrink-0 text-jackals-red-light">•</span>
        <span>{line.replace(BULLET_PATTERN, "")}</span>
      </div>
    );
  }

  return <p key={key}>{line}</p>;
}

export function EventDescription({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
      {paragraphs.map((paragraph, paragraphIndex) => {
        const lines = paragraph
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines.length === 0) return null;

        const isBulletBlock = lines.every(
          (line) => BULLET_PATTERN.test(line) || line.startsWith("•"),
        );

        if (isBulletBlock) {
          return (
            <ul key={paragraphIndex} className="space-y-2.5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex} className="flex gap-2.5">
                  <span className="mt-0.5 shrink-0 text-jackals-red-light">
                    •
                  </span>
                  <span>{line.replace(BULLET_PATTERN, "")}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (lines.length === 1) {
          return renderLine(lines[0], `${paragraphIndex}-0`);
        }

        return (
          <div key={paragraphIndex} className="space-y-2">
            {lines.map((line, lineIndex) =>
              renderLine(line, `${paragraphIndex}-${lineIndex}`),
            )}
          </div>
        );
      })}
    </div>
  );
}
