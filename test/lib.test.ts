import { describe, expect, it } from "vitest";
import { matchAttendance } from "../agent/lib/attendance";
import { parseCsv } from "../agent/lib/csv";
import { resolveDataFile } from "../agent/lib/files";
import { reviewSubmissions } from "../agent/lib/submissions";

const roster = ["Priya Nair", "Priya Shah", "Jordan Lee", "Sam Taylor", "Samantha Taylor", "Wei Zhang"];

describe("matchAttendance", () => {
  it("counts exact names regardless of case and accents", () => {
    const r = matchAttendance(["José Ruiz", "Wei Zhang"], ["jose ruiz", "WEI ZHANG"]);
    expect(r.present).toEqual(["José Ruiz", "Wei Zhang"]);
    expect(r.notSeen).toEqual([]);
  });

  it("sends a first name shared by two students to a person", () => {
    const r = matchAttendance(roster, ["Priya"]);
    expect(r.unclear).toEqual([{ name: "Priya", candidates: ["Priya Nair", "Priya Shah"] }]);
    expect(r.present).toEqual([]);
    expect(r.notSeen).not.toContain("Priya Nair");
  });

  it("does not auto-accept a near miss", () => {
    const r = matchAttendance(roster, ["Jordon Lee"]);
    expect(r.present).not.toContain("Jordan Lee");
    expect(r.unclear[0].candidates).toEqual(["Jordan Lee"]);
  });

  it("does not offer a student who is already present", () => {
    const r = matchAttendance(roster, ["Priya Nair", "Priya"]);
    expect(r.unclear).toEqual([{ name: "Priya", candidates: ["Priya Shah"] }]);
  });

  it("reports strangers separately and everyone else as not seen", () => {
    const r = matchAttendance(["Wei Zhang", "Jordan Lee"], ["Wei Zhang", "Visiting Professor"]);
    expect(r.unmatched).toEqual(["Visiting Professor"]);
    expect(r.notSeen).toEqual(["Jordan Lee"]);
  });
});

describe("reviewSubmissions", () => {
  const due = "2026-10-20T23:59:00-07:00";
  it("classifies groups using the latest submission", () => {
    const rows = reviewSubmissions(["A", "B", "C"], [
      { group: "A", submitted_at: "2026-10-20T20:00:00-07:00" },
      { group: "B", submitted_at: "2026-10-20T20:00:00-07:00" },
      { group: "B", submitted_at: "2026-10-21T00:09:00-07:00" },
    ], due);
    expect(rows.map((r) => r.status)).toEqual(["on_time", "late", "missing"]);
    expect(rows[1].minutesLate).toBe(10);
  });

  it("counts a submission exactly at the deadline as on time", () => {
    expect(reviewSubmissions(["A"], [{ group: "A", submitted_at: due }], due)[0].status).toBe("on_time");
  });

  it("rejects submissions from unknown groups and bad dates", () => {
    expect(() => reviewSubmissions(["A"], [{ group: "Z", submitted_at: due }], due)).toThrow(/unknown groups/);
    expect(() => reviewSubmissions(["A"], [], "soon")).toThrow(/Invalid due date/);
  });
});

describe("files and csv", () => {
  it("refuses paths outside the data folder", () => {
    expect(() => resolveDataFile("../.env", "/tmp/data")).toThrow(/outside/);
    expect(() => resolveDataFile("/etc/passwd", "/tmp/data")).toThrow(/outside/);
    expect(resolveDataFile("roster.csv", "/tmp/data")).toBe("/tmp/data/roster.csv");
  });

  it("reads quoted fields", () => {
    expect(parseCsv('Name,Note\r\n"Lee, Jordan","said ""hi"""\r\n')).toEqual([{ name: "Lee, Jordan", note: 'said "hi"' }]);
  });
});
