import { describe, expect, it } from "vitest";
import { parseImportJson, toTaskData, toTaskWire } from "./taskSchema";

describe("task schema", () => {
  it("parses versioned import document", () => {
    const parsed = parseImportJson(
      JSON.stringify({
        version: 1,
        tasks: [
          {
            id: "t1",
            title: "Plan sprint",
            completed: false,
            priority: "high",
            date: "2026-05-09",
            status: "ready",
          },
        ],
      }),
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0].date).toBe("2026-05-09");
  });

  it("migrates legacy array shape and normalizes date", () => {
    const parsed = parseImportJson(
      JSON.stringify([
        {
          id: "t1",
          title: "Legacy",
          completed: false,
          priority: "low",
          date: "2026-05-09T10:30:00.000Z",
        },
      ]),
    );

    expect(parsed[0].date).toBe("2026-05-09");
  });

  it("converts between wire and app model", () => {
    const task = toTaskData({
      id: "t1",
      title: "Sync",
      completed: false,
      priority: "medium",
      date: "2026-05-09",
      status: "inbox",
    });

    const wire = toTaskWire(task);
    expect(wire.date).toBe("2026-05-09");
    expect(wire.status).toBe("inbox");
  });
});
