import {describe,it,expect} from 'vitest';
import {parseView,pilotRules,submissionSchema} from '../lib/internship-content';
describe('InternShip pilot rules',()=>{
 it('defaults to student and supports company sharing',()=>{expect(parseView(undefined)).toBe('student');expect(parseView('company')).toBe('company');expect(parseView('bad')).toBe('student');});
 it('is free for students',()=>expect(pilotRules.studentCost).toBe(0));
 it('is free for companies during the pilot',()=>expect(pilotRules.companyPilotCost).toBe(0));
 it('confirms listings within one business day',()=>expect(pilotRules.confirmationBusinessDays).toBe(1));
 it('allows 3rd and 4th-year students of all five SDT programs',()=>{expect(pilotRules.eligibleYears).toEqual([3,4]);expect(pilotRules.programs).toEqual(['Cybersecurity','Digital Engineering','Digital Management and Design','Statistics and Data Science','Applied Mathematics in the Digital Economy']);});
 it('SDT students complete two internships',()=>expect(pilotRules.requiredInternships).toBe(2));
 it('tracks Sent, Viewed, Interview, Offer and Declined statuses',()=>expect(pilotRules.applicationStatuses).toEqual(['Sent','Viewed','Interview','Offer','Declined']));
 it('requires pay, location, slots, tasks, stack and a contact for listings',()=>{const details={company:'Almaty IT',title:'Frontend intern',tasks:'Build UI',stack:'React',contact:'Hiring lead',location:'Almaty',pay:'unpaid',format:'hybrid',slots:'2'};expect(submissionSchema.safeParse({audience:'company',kind:'listing',email:'test@example.com',details}).success).toBe(true);for(const key of ['pay','location','slots','tasks','stack','contact'])expect(submissionSchema.safeParse({audience:'company',kind:'listing',email:'test@example.com',details:{...details,[key]:''}}).success).toBe(false);});
 it('requires a positive integer open slot count',()=>expect(submissionSchema.safeParse({audience:'company',kind:'listing',email:'test@example.com',details:{company:'Test',title:'Intern',tasks:'Build',stack:'React',contact:'Lead',location:'Almaty',pay:'unpaid',format:'hybrid',slots:'0'}}).success).toBe(false));
 it('accepts email signup but rejects malformed email',()=>{expect(submissionSchema.safeParse({audience:'student',kind:'signup',email:'student@example.com'}).success).toBe(true);expect(submissionSchema.safeParse({audience:'student',kind:'signup',email:'not-email'}).success).toBe(false);});
});
