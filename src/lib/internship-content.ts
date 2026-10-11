import { z } from 'zod';
export type View = 'student' | 'company';
export const parseView = (value: unknown): View => value === 'company' ? 'company' : 'student';
export const pilotRules = {
  studentCost: 0, companyPilotCost: 0, confirmationBusinessDays: 1, eligibleYears: [3, 4], requiredInternships: 2,
  programs: ['Cybersecurity', 'Digital Engineering', 'Digital Management and Design', 'Statistics and Data Science', 'Applied Mathematics in the Digital Economy'],
  applicationStatuses: ['Sent', 'Viewed', 'Interview', 'Offer', 'Declined'], formats: ['office', 'hybrid', 'remote'],
} as const;
export const submissionSchema = z.object({ audience:z.enum(['student','company']), kind:z.enum(['signup','listing','call_request']), email:z.string().trim().toLowerCase().email().max(254), details:z.record(z.string().max(2000)).default({}) }).superRefine((data,ctx)=>{ if (data.audience==='student' && data.kind!=='signup') ctx.addIssue({code:'custom',message:'Invalid student request'}); if(data.audience==='company' && data.kind==='signup') ctx.addIssue({code:'custom',message:'Invalid company request'}); if(data.kind==='listing') for(const key of ['company','title','tasks','stack','contact','location','pay','format','slots']) { if(!data.details[key]?.trim()) ctx.addIssue({code:'custom',message:`Please complete ${key}`}); } if(data.kind==='listing' && (!Number.isInteger(Number(data.details['slots'])) || Number(data.details['slots'])<1)) ctx.addIssue({code:'custom',message:'At least one open slot is required'}); });
export const content = {
 student: {
  title:'One profile. Verified companies that actually take interns. Apply to several at once.',
  subtitle:'InternShip is an online marketplace where students build one profile and CV, browse companies verified to accept interns, and apply to several at once — with every application tracked in one dashboard.',
  cta:'Find my internship', micro:'Drop your email — we’ll open your profile and ping you on Telegram. No spam.',
  quotesPlaceholder:false,
  quotes:['“I just asked around. That’s how everyone I know found theirs.”','“I cold-applied to more than ten companies. Got two replies.”','“One placement came after around fifty applications.”','“I spent a lot of nerves on this.”','“Panic.”','“Desperation.”'],
  stat:'Of 20 SDT students we interviewed, 18 searched informally. 8 cold-applied to 10 or more companies. 11 got their placement through a personal contact. 16 of 20 said the Career Center played little or no role. Among students who cold-applied to 10 or more companies, reply rates were roughly 5–30%.',
  features:[['One profile + CV','“I’ve filled out five different forms already.”','Build it once. Every company sees the same profile. Upload your CV and we pre-fill it.'],['Verified companies only','“Half these listings are fake or already closed.”','Every company is confirmed in writing to accept interns before it’s listed.'],['Multi-apply','“Applying one by one takes forever.”','Apply to several companies with one click. Your profile and CV go to each.'],['One dashboard','“I lose track of who replied.”','Every application’s status — sent, viewed, interview, offer, declined — on one screen.'],['Telegram alerts','“I only check email once a week.”','Status changes and new openings arrive in Telegram.'],['Paperwork support','“The university paperwork is a maze.”','Every listing states whether the company can sign your internship paperwork — so you don’t find out later.']],
  objection:'Among students who cold-applied to 10 or more companies, reply rates were roughly 5–30%. Verified listings get answered because the company already said yes to interns.',
  secondTitle:'Stop guessing which companies take interns.', secondSub:'One profile. Verified companies. One dashboard.', secondMicro:'Free for students. Telegram notifications on.', benefits:['One profile','Verified companies','One dashboard'],
  founder:'We read 20 interviews from our own program. Students searched informally, cold-applied to dozens of companies, and most placements came through a personal contact. The problem was never that students didn’t try — it was that they had no reliable way to know which companies would actually take them. InternShip exists so the next SDT student doesn’t have to guess.',
  signoff:'Narxoz School of Digital Technologies',
 },
 company: {
  title:'List your internship slots to verified Narxoz SDT students.',
  subtitle:'InternShip is an online marketplace where Almaty IT and digital companies publish internship slots with tasks, requirements, and a contact person, and receive structured applications from 3rd and 4th-year students of the Narxoz School of Digital Technologies.',
  cta:'List an internship slot', micro:'Takes 5 minutes. We confirm your listing before it goes live.',
  quotesPlaceholder:true,
  quotes:['“Post your first internship slot.”','“We confirm your listing before it goes live.”','“Free during the pilot.”'],
  stat:'SDT students must complete two internships during their studies. They are on the platform looking for placements now.',
  features:[['Free verified listing','“Why would I pay to post?”','Free during the pilot. Post a slot, see applicants.'],['Verified students','“I don’t have time to filter CVs.”','Every applicant is a 3rd or 4th-year Narxoz SDT student, verified by program.'],['Tasks + requirements + contact person','“Interns show up with no idea what to do.”','You define the task, tech stack, location, pay, slots, and contact person up front. The listing states whether you can sign the university’s paperwork.'],['One pipeline for applicants','“Applications get scattered across email.”','Every applicant with their CV in one view. Invite or decline from the same screen.'],['Telegram alerts','“I’ll forget to check.”','New applicant → Telegram ping.'],['Onboarding in the first version','“I don’t want to figure out a new tool.”','In the first version our team onboards each company through a short call and a form. You don’t set anything up alone.']],
  objection:'Students are already searching, cold-applying, and asking around. Listing on InternShip puts your slot in front of SDT students who are looking for exactly this.',
  secondTitle:'Have an internship slot to fill?', secondSub:'Free listing. Verified SDT students. One pipeline.', secondMicro:'We’ll confirm your listing within 1 business day.', benefits:['Free listing','Verified SDT students','One pipeline'],
  founder:'We built InternShip because SDT students told us the same thing in every interview: they cold-applied to dozens of companies and most never heard back. Companies that would take interns had no channel to reach students who were ready. So we made listing a slot take five minutes — and made every applicant a verified Narxoz SDT student.',
  signoff:'',
 },
};
export const faqs = (view:View) => [
 ['eligibility',view==='student'?'Who can apply?':'Who will apply to my listing?','3rd and 4th-year students of the Narxoz School of Digital Technologies, across all SDT programs: Cybersecurity, Digital Engineering, Digital Management and Design, Statistics and Data Science, and Applied Mathematics in the Digital Economy. SDT students complete two internships, which is why both years are on the platform.'],
 ['verification','How are companies verified?','In the first version our team onboards each company through a short call and a form that confirms it accepts students, and records its slots and requirements. Only then is the listing published.'],
 ['paperwork','Is the paperwork handled?','Every listing states whether the company can sign the university’s internship paperwork — so students don’t find out after applying.'],
 ['format','How are pay and format shown?','Every listing shows what interns do, the department or tech stack, location and format, whether the internship is paid, and how many slots are open.'],
 ['student-cost','Does it cost students anything?','No. Free for students.'],
 ['replies',view==='student'?'What if no company replies?':'What do students see after applying?','Your dashboard shows every application’s status, and you can see which companies have viewed your profile.'.replace('Your dashboard',view==='student'?'Your dashboard':'Their dashboard').replace('you can see which companies have viewed your profile',view==='student'?'you can see which companies have viewed your profile':'they can see which companies have viewed their profile')],
 ['company-cost','What does it cost companies?','Free during the pilot.'],
 ['onboarding','How do companies get onboarded?','In the first version, through a short call and a form with our team.'],
];
