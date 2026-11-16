import { describe, expect, it } from "vitest";
import { emptyCv, rankApplicants, scoreCv, type Cv } from "../lib/cv";
import { dictionaries, parseLang } from "../lib/i18n";
import { contentFor, faqs } from "../lib/internship-content";
import { isNarxozEmail } from "../lib/use-auth";

const magnum = { stack: "SQL, Python, Apache Spark, MinIO, StarRocks, Trino" };
const cv = (patch: Partial<Cv>): Cv => ({ ...emptyCv, full_name: "Student", ...patch });

describe("Applicant ranking", () => {
  it("rewards skills that match the internship stack", () => {
    const strong = scoreCv(cv({ skills: "SQL, Python, Apache Spark, Trino" }), magnum);
    const weak = scoreCv(cv({ skills: "Figma, Photoshop" }), magnum);
    expect(strong.matched).toEqual(["sql", "python", "apache spark", "trino"]);
    expect(weak.matched).toEqual([]);
    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it("matches whole terms only, so 'R' does not match every word containing r", () => {
    expect(scoreCv(cv({ skills: "Docker, React" }), { stack: "R" }).matched).toEqual([]);
    expect(scoreCv(cv({ skills: "R, Excel" }), { stack: "R" }).matched).toEqual(["r"]);
  });

  it("finds skills mentioned in experience and projects, not just the skills list", () => {
    expect(scoreCv(cv({ projects: "Built an ETL job on Apache Spark" }), magnum).matched).toEqual([
      "apache spark",
    ]);
  });

  it("keeps scores within 0–100", () => {
    const full = cv({
      summary: "x",
      skills: magnum.stack,
      experience: "x",
      projects: "x",
      education: "x",
      links: "x",
      gpa: 4,
      year: 4,
    });
    expect(scoreCv(full, magnum).score).toBe(100);
    expect(scoreCv(cv({ year: null }), magnum).score).toBe(0);
  });

  it("ranks the strongest CVs first for the top-3 view", () => {
    const ranked = rankApplicants(
      [
        { id: "a", cv: cv({ skills: "Figma" }) },
        { id: "b", cv: cv({ skills: "SQL, Python, Trino", gpa: 3.6 }) },
        { id: "c", cv: cv({ skills: "SQL" }) },
        { id: "d", cv: cv({ skills: "SQL, Python" }) },
      ],
      magnum,
    );
    expect(ranked.slice(0, 3).map((r) => r.id)).toEqual(["b", "d", "c"]);
  });
});

describe("Accounts", () => {
  it("only treats @narxoz.kz addresses as student emails", () => {
    expect(isNarxozEmail("Aruzhan@Narxoz.kz")).toBe(true);
    expect(isNarxozEmail("someone@gmail.com")).toBe(false);
    expect(isNarxozEmail("x@narxoz.kz.evil.com")).toBe(false);
  });
});

describe("Russian translation", () => {
  it("defaults to English and accepts ru", () => {
    expect(parseLang(undefined)).toBe("en");
    expect(parseLang("ru")).toBe("ru");
    expect(parseLang("de")).toBe("en");
  });

  const shape = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(shape)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map((k) => [k, shape((value as Record<string, unknown>)[k])]),
          )
        : typeof value;

  it("covers every UI string", () =>
    expect(shape(dictionaries.ru)).toEqual(shape(dictionaries.en)));
  it("covers both landing views", () =>
    expect(shape(contentFor("ru"))).toEqual(shape(contentFor("en"))));
  it("covers the FAQ for both views", () => {
    for (const view of ["student", "company"] as const) {
      expect(faqs(view, "ru").map((f) => f[0])).toEqual(faqs(view, "en").map((f) => f[0]));
      expect(faqs(view, "ru")[0]?.[1]).not.toEqual(faqs(view, "en")[0]?.[1]);
    }
  });
});
