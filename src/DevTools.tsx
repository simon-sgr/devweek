import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Zap, GitCompare } from "lucide-react";
import "./DevTools.css";

type DevToolView = "compare" | "cleanup";

type CleanupOptions = {
  replaceTabs: boolean;
  trimTrailing: boolean;
  trimEmptyLines: boolean;
  normalizeSpaces: boolean;
  tabSpaces: number;
};

type CharDiff = {
  type: "add" | "remove" | "equal";
  value: string;
};

type DiffToken = CharDiff & {
  leftValue?: string;
  rightValue?: string;
};

function computeAlignedCharDiff(left: string, right: string): DiffToken[] {
  const leftChars = Array.from(left);
  const rightChars = Array.from(right);
  const rows = leftChars.length + 1;
  const columns = rightChars.length + 1;
  const table = Array.from({ length: rows }, () =>
    Array<number>(columns).fill(0),
  );

  for (let i = leftChars.length - 1; i >= 0; i--) {
    for (let j = rightChars.length - 1; j >= 0; j--) {
      table[i][j] =
        leftChars[i] === rightChars[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;

  while (i < leftChars.length && j < rightChars.length) {
    if (leftChars[i] === rightChars[j]) {
      tokens.push({
        type: "equal",
        value: leftChars[i],
        leftValue: leftChars[i],
        rightValue: rightChars[j],
      });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      tokens.push({
        type: "remove",
        value: leftChars[i],
        leftValue: leftChars[i],
        rightValue: "",
      });
      i++;
    } else {
      tokens.push({
        type: "add",
        value: rightChars[j],
        leftValue: "",
        rightValue: rightChars[j],
      });
      j++;
    }
  }

  while (i < leftChars.length) {
    tokens.push({
      type: "remove",
      value: leftChars[i],
      leftValue: leftChars[i],
      rightValue: "",
    });
    i++;
  }

  while (j < rightChars.length) {
    tokens.push({
      type: "add",
      value: rightChars[j],
      leftValue: "",
      rightValue: rightChars[j],
    });
    j++;
  }

  return tokens;
}

function splitByLine(value: string): string[] {
  return value.length ? value.split("\n") : [];
}

function useAutoGrowTextarea(maxHeight = 180) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const resize = () => {
    const element = ref.current;
    if (!element) return;

    element.style.height = "auto";
    const nextHeight = Math.min(element.scrollHeight, maxHeight);
    element.style.height = `${nextHeight}px`;
    element.style.overflowY =
      element.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  return { ref, resize };
}

export default function DevTools() {
  const [activeView, setActiveView] = useState<DevToolView>("compare");

  const [textLeft, setTextLeft] = useState("");
  const [textRight, setTextRight] = useState("");

  const [cleanText, setCleanText] = useState("");
  const [cleanedResult, setCleanedResult] = useState("");
  const [cleanupOptions, setCleanupOptions] = useState<CleanupOptions>({
    replaceTabs: true,
    trimTrailing: true,
    trimEmptyLines: true,
    normalizeSpaces: true,
    tabSpaces: 2,
  });
  const [cleanupStatus, setCleanupStatus] = useState("");

  const leftTextarea = useAutoGrowTextarea(180);
  const rightTextarea = useAutoGrowTextarea(180);
  const cleanupTextarea = useAutoGrowTextarea(180);
  const cleanedTextarea = useAutoGrowTextarea(180);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    leftTextarea.resize();
  }, [textLeft]);

  useEffect(() => {
    rightTextarea.resize();
  }, [textRight]);

  useEffect(() => {
    cleanupTextarea.resize();
  }, [cleanText]);

  useEffect(() => {
    cleanedTextarea.resize();
  }, [cleanedResult]);

  const cleanupText = () => {
    let result = cleanText;

    if (cleanupOptions.replaceTabs) {
      const spaces = " ".repeat(cleanupOptions.tabSpaces);
      result = result.replace(/\t/g, spaces);
    }

    if (cleanupOptions.trimTrailing) {
      result = result
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n");
    }

    if (cleanupOptions.trimEmptyLines) {
      result = result.replace(/\n+$/, "");
    }

    if (cleanupOptions.normalizeSpaces) {
      result = result.replace(/  +/g, " ");
    }

    setCleanedResult(result);
    setCleanupStatus("Cleaned!");
    setTimeout(() => setCleanupStatus(""), 2000);
  };

  const resetCleanup = () => {
    setCleanText("");
    setCleanedResult("");
  };

  const toggleOption = (key: keyof Omit<CleanupOptions, "tabSpaces">) => {
    setCleanupOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getDiffLines = (left: string, right: string) => {
    const leftLines = splitByLine(left);
    const rightLines = splitByLine(right);
    const maxLines = Math.max(leftLines.length, rightLines.length);

    return Array.from({ length: maxLines }, (_, i) => ({
      leftLine: leftLines[i] ?? "",
      rightLine: rightLines[i] ?? "",
      alignedDiff: computeAlignedCharDiff(
        leftLines[i] ?? "",
        rightLines[i] ?? "",
      ),
      lineNum: i + 1,
    }));
  };

  const diffLines = useMemo(
    () => getDiffLines(textLeft, textRight),
    [textLeft, textRight],
  );
  const hasDifferences = diffLines.some(
    (line) => line.leftLine !== line.rightLine,
  );

  const renderLeftToken = (token: DiffToken) => {
    if (token.type === "add") {
      return { className: "char remove", value: "\u00A0" };
    }

    return {
      className: `char ${token.type}`,
      value: token.leftValue || token.value || "\u00A0",
    };
  };

  const renderRightToken = (token: DiffToken) => {
    if (token.type === "remove") {
      return { className: "char remove", value: "\u00A0" };
    }

    return {
      className: `char ${token.type}`,
      value: token.rightValue || token.value || "\u00A0",
    };
  };

  return (
    <div className="devtools-layout">
      <nav className="devtools-menu">
        <button
          className={`devtools-menu-item ${activeView === "compare" ? "active" : ""}`}
          onClick={() => setActiveView("compare")}
        >
          <GitCompare size={18} />
          <span>Compare Text</span>
        </button>
        <button
          className={`devtools-menu-item ${activeView === "cleanup" ? "active" : ""}`}
          onClick={() => setActiveView("cleanup")}
        >
          <Zap size={18} />
          <span>Cleanup Text</span>
        </button>
      </nav>

      <div className="devtools-content">
        {activeView === "compare" && (
          <div className="devtools-section">
            <h3>
              <GitCompare size={18} />
              Text Comparison
            </h3>
            <p>
              Compare two texts side by side with color-highlighted differences.
            </p>

            <div className="comparison-grid">
              <div className="comparison-pane">
                <label>Text 1</label>
                <textarea
                  ref={leftTextarea.ref}
                  value={textLeft}
                  onChange={(e) => setTextLeft(e.target.value)}
                  onInput={leftTextarea.resize}
                  placeholder="Paste or type first text here..."
                />
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(textLeft)}
                  disabled={!textLeft}
                >
                  <Copy size={16} />
                  Copy
                </button>
              </div>

              <div className="comparison-pane">
                <label>Text 2</label>
                <textarea
                  ref={rightTextarea.ref}
                  value={textRight}
                  onChange={(e) => setTextRight(e.target.value)}
                  onInput={rightTextarea.resize}
                  placeholder="Paste or type second text here..."
                />
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(textRight)}
                  disabled={!textRight}
                >
                  <Copy size={16} />
                  Copy
                </button>
              </div>
            </div>

            {textLeft && textRight && (
              <div className="comparison-result">
                <strong>
                  {hasDifferences
                    ? `? Differences found on ${diffLines.filter((line) => line.leftLine !== line.rightLine).length} line(s)`
                    : "? Texts are identical"}
                </strong>

                {hasDifferences && (
                  <div className="diff-display">
                    <div className="diff-pane">
                      <strong>Text 1</strong>
                      {diffLines.map((chunk, i) => (
                        <div
                          key={i}
                          className={`diff-line ${chunk.leftLine !== chunk.rightLine ? "diff-left" : ""}`}
                        >
                          <span className="line-number">{i + 1}</span>
                          <span className="line-content line-chars">
                            {chunk.alignedDiff.map((token, tokenIndex) => {
                              const rendered = renderLeftToken(token);

                              return (
                                <span
                                  key={tokenIndex}
                                  className={rendered.className}
                                >
                                  {rendered.value}
                                </span>
                              );
                            })}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="diff-pane">
                      <strong>Text 2</strong>
                      {diffLines.map((chunk, i) => (
                        <div
                          key={i}
                          className={`diff-line ${chunk.leftLine !== chunk.rightLine ? "diff-right" : ""}`}
                        >
                          <span className="line-number">{i + 1}</span>
                          <span className="line-content line-chars">
                            {chunk.alignedDiff.map((token, tokenIndex) => {
                              const rendered = renderRightToken(token);

                              return (
                                <span
                                  key={tokenIndex}
                                  className={rendered.className}
                                >
                                  {rendered.value}
                                </span>
                              );
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeView === "cleanup" && (
          <div className="devtools-section">
            <h3>
              <Zap size={18} />
              Text Cleanup
            </h3>
            <p>Clean up text with configurable options.</p>

            <div className="cleanup-options">
              <label className="cleanup-checkbox">
                <input
                  type="checkbox"
                  checked={cleanupOptions.replaceTabs}
                  onChange={() => toggleOption("replaceTabs")}
                />
                <span>Replace tabs with spaces</span>
              </label>
              <label className="cleanup-checkbox">
                <input
                  type="checkbox"
                  checked={cleanupOptions.trimTrailing}
                  onChange={() => toggleOption("trimTrailing")}
                />
                <span>Remove trailing spaces</span>
              </label>
              <label className="cleanup-checkbox">
                <input
                  type="checkbox"
                  checked={cleanupOptions.trimEmptyLines}
                  onChange={() => toggleOption("trimEmptyLines")}
                />
                <span>Remove trailing empty lines</span>
              </label>
              <label className="cleanup-checkbox">
                <input
                  type="checkbox"
                  checked={cleanupOptions.normalizeSpaces}
                  onChange={() => toggleOption("normalizeSpaces")}
                />
                <span>Normalize multiple spaces</span>
              </label>
            </div>

            <div className="cleanup-grid">
              <div className="cleanup-pane">
                <label>Original Text</label>
                <textarea
                  ref={cleanupTextarea.ref}
                  value={cleanText}
                  onChange={(e) => setCleanText(e.target.value)}
                  onInput={cleanupTextarea.resize}
                  placeholder="Paste text to clean here..."
                />
              </div>

              <div className="cleanup-pane">
                <label>Cleaned Text</label>
                <textarea
                  ref={cleanedTextarea.ref}
                  value={cleanedResult}
                  readOnly
                  placeholder="Cleaned result will appear here..."
                />
                {cleanedResult && (
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(cleanedResult)}
                    title="Copy to clipboard"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                )}
              </div>
            </div>

            <div className="cleanup-actions">
              <button
                className="cleanup-btn primary"
                onClick={cleanupText}
                disabled={!cleanText}
              >
                Clean Text
              </button>
              <button className="cleanup-btn secondary" onClick={resetCleanup}>
                Reset
              </button>
            </div>

            {cleanupStatus && (
              <div className="cleanup-status">{cleanupStatus}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
