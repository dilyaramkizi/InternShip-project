import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);

export const cvSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  headline: text(160),
  program: text(120),
  year: z.number().int().min(1).max(6).nullable(),
  gpa: z.number().min(0).max(4).nullable(),
  phone: text(40),
  telegram: text(60),
  summary: text(2000),
  skills: text(1000),
  experience: text(4000),
  projects: text(4000),
  education: text(2000),
  languages: text(300),
  links: text(600),
});
export type Cv = z.infer<typeof cvSchema>;

export const emptyCv: Cv = {
  full_name: "",
  headline: "",
  program: "",
  year: 4,
  gpa: null,
  phone: "",
  telegram: "",
  summary: "",
  skills: "",
  experience: "",
  projects: "",
  education: "",
  languages: "",
  links: "",
};

export const splitList = (value: string) =>
  value
    .split(/[,;·\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

export const splitLines = (value: string) =>
  value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

type RankedInternship = { stack: string; requirements?: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasTerm = (haystack: string, term: string) =>
  new RegExp(`(^|[^\\p{L}\\p{N}])${escape(term)}($|[^\\p{L}\\p{N}])`, "u").test(haystack);

/**
 * Scores a CV against an internship out of 100:
 * 60 for skills that match the internship's stack, 20 for CV completeness,
 * 10 for GPA and 10 for year of study (later years score higher).
 */
export function scoreCv(
  cv: Cv,
  internship: RankedInternship,
): { score: number; matched: string[] } {
  const terms = [...new Set(splitList(internship.stack).map((t) => t.toLowerCase()))];
  const haystack = [cv.headline, cv.summary, cv.skills, cv.experience, cv.projects]
    .join("\n")
    .toLowerCase();
  const matched = terms.filter((t) => hasTerm(haystack, t));
  const skill = terms.length ? (matched.length / terms.length) * 60 : 30;
  const sections = [cv.summary, cv.skills, cv.experience, cv.projects, cv.education, cv.links];
  const completeness = (sections.filter((s) => s.trim()).length / sections.length) * 20;
  const gpa = cv.gpa == null ? 0 : (Math.min(cv.gpa, 4) / 4) * 10;
  const year = cv.year == null ? 0 : (Math.min(cv.year, 4) / 4) * 10;
  return { score: Math.round(skill + completeness + gpa + year), matched };
}

/** Highest scores first; ties keep the original (application) order. */
export function rankApplicants<T extends { cv: Cv }>(
  applicants: T[],
  internship: RankedInternship,
): (T & { score: number; matched: string[] })[] {
  return applicants
    .map((a) => ({ ...a, ...scoreCv(a.cv, internship) }))
    .sort((a, b) => b.score - a.score);
}
