import { z } from 'zod';
import type { Lang } from './i18n';
export type View = 'student' | 'company';
export const parseView = (value: unknown): View => value === 'company' ? 'company' : 'student';
export const pilotRules = {
  studentCost: 0, companyPilotCost: 0, confirmationBusinessDays: 1, eligibleYears: [3, 4], requiredInternships: 2,
  programs: ['Cybersecurity', 'Digital Engineering', 'Digital Management and Design', 'Statistics and Data Science', 'Applied Mathematics in the Digital Economy'],
  applicationStatuses: ['Sent', 'Viewed', 'Interview', 'Offer', 'Declined'], formats: ['office', 'hybrid', 'remote'],
} as const;
export const submissionSchema = z
  .object({
    audience: z.enum(['student', 'company']),
    kind: z.enum(['signup', 'listing', 'call_request']),
    email: z.string().trim().toLowerCase().email().max(254),
    details: z.record(z.string().max(2000)).default({}),
  })
  .superRefine((data, ctx) => {
    if (data.audience === 'student' && data.kind !== 'signup')
      ctx.addIssue({ code: 'custom', message: 'Invalid student request' });
    if (data.audience === 'company' && data.kind === 'signup')
      ctx.addIssue({ code: 'custom', message: 'Invalid company request' });

    // ↓↓↓ НОВОЕ ↓↓↓
    if (
      data.audience === 'student' &&
      data.kind === 'signup' &&
      !data.email.endsWith('@narxoz.kz')
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please use your Narxoz email (@narxoz.kz)',
        path: ['email'],
      });
    }
    // ↑↑↑ НОВОЕ ↑↑↑

    if (data.kind === 'listing')
      for (const key of ['company', 'title', 'tasks', 'stack', 'contact', 'location', 'pay', 'format', 'slots']) {
        if (!data.details[key]?.trim())
          ctx.addIssue({ code: 'custom', message: `Please complete ${key}` });
      }
    if (data.kind === 'listing' &&
        (!Number.isInteger(Number(data.details['slots'])) || Number(data.details['slots']) < 1))
      ctx.addIssue({ code: 'custom', message: 'At least one open slot is required' });
  });
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
const contentRu: typeof content = {
 student: {
  title:'Один профиль. Проверенные компании, которые действительно берут стажёров. Отклик сразу в несколько.',
  subtitle:'InternShip — онлайн-площадка, где студенты один раз создают профиль и резюме, просматривают компании, подтвердившие приём стажёров, и откликаются сразу в несколько — а каждый отклик отслеживается в одной панели.',
  cta:'Найти стажировку', micro:'Оставьте почту — мы откроем ваш профиль и напишем в Telegram. Без спама.',
  quotesPlaceholder:false,
  quotes:['«Я просто спрашивал знакомых. Так все, кого я знаю, и нашли свою.»','«Я отправил резюме в больше чем десять компаний. Ответили две.»','«Одно место нашлось примерно после пятидесяти откликов.»','«Я потратил на это кучу нервов.»','«Паника.»','«Отчаяние.»'],
  stat:'Из 20 опрошенных студентов ШЦТ 18 искали неформально. 8 отправили резюме в 10 и более компаний. 11 нашли место через личные знакомства. 16 из 20 сказали, что Карьерный центр почти не помог. У тех, кто писал в 10 и более компаний, доля ответов была примерно 5–30%.',
  features:[['Один профиль + резюме','«Я уже заполнил пять разных анкет.»','Создайте один раз. Все компании видят один и тот же профиль. Загрузите резюме — мы заполним остальное.'],['Только проверенные компании','«Половина вакансий фейковые или уже закрыты.»','Каждая компания письменно подтверждает, что берёт стажёров, до публикации.'],['Отклик сразу в несколько','«Откликаться по одной — вечность.»','Откликнитесь в несколько компаний одним кликом. Профиль и резюме уйдут каждой.'],['Одна панель','«Я теряю, кто мне ответил.»','Статус каждого отклика — отправлено, просмотрено, интервью, оффер, отказ — на одном экране.'],['Уведомления в Telegram','«Я проверяю почту раз в неделю.»','Смена статусов и новые вакансии приходят в Telegram.'],['Помощь с документами','«Университетские документы — это лабиринт.»','В каждой вакансии указано, может ли компания подписать документы о практике — чтобы не узнать об этом слишком поздно.']],
  objection:'У студентов, писавших в 10 и более компаний, доля ответов была около 5–30%. На проверенные вакансии отвечают — компания уже согласилась брать стажёров.',
  secondTitle:'Хватит гадать, какие компании берут стажёров.', secondSub:'Один профиль. Проверенные компании. Одна панель.', secondMicro:'Бесплатно для студентов. Уведомления в Telegram включены.', benefits:['Один профиль','Проверенные компании','Одна панель'],
  founder:'Мы прочитали 20 интервью студентов нашей школы. Они искали неформально, писали в десятки компаний, а большинство мест находили через знакомых. Проблема никогда не была в том, что студенты не старались — у них просто не было надёжного способа узнать, какие компании действительно их возьмут. InternShip существует, чтобы следующему студенту ШЦТ не пришлось гадать.',
  signoff:'Школа цифровых технологий Нархоз',
 },
 company: {
  title:'Разместите стажировки для проверенных студентов ШЦТ Нархоз.',
  subtitle:'InternShip — онлайн-площадка, где IT- и digital-компании Алматы публикуют стажировки с задачами, требованиями и контактным лицом и получают структурированные отклики от студентов 3–4 курсов Школы цифровых технологий Нархоз.',
  cta:'Разместить стажировку', micro:'Займёт 5 минут. Мы проверим вакансию перед публикацией.',
  quotesPlaceholder:true,
  quotes:['«Разместите первую стажировку.»','«Мы проверим вакансию перед публикацией.»','«Бесплатно во время пилота.»'],
  stat:'Студенты ШЦТ проходят две практики за время учёбы. Они уже на платформе и ищут места.',
  features:[['Бесплатное размещение','«Зачем платить за публикацию?»','Бесплатно во время пилота. Разместите вакансию — получите кандидатов.'],['Проверенные студенты','«У меня нет времени фильтровать резюме.»','Каждый кандидат — студент 3–4 курса ШЦТ Нархоз, подтверждённый программой.'],['Задачи + требования + контакт','«Стажёры приходят и не знают, что делать.»','Вы заранее задаёте задачу, стек, город, оплату, число мест и контактное лицо. В вакансии указано, можете ли вы подписать документы университета.'],['Одна воронка кандидатов','«Отклики разбросаны по почте.»','Все кандидаты с резюме в одном окне. Приглашайте или отказывайте там же.'],['Уведомления в Telegram','«Я забуду проверить.»','Новый кандидат → сообщение в Telegram.'],['Онбординг в первой версии','«Не хочу разбираться в новом инструменте.»','В первой версии наша команда подключает каждую компанию через короткий звонок и форму. Вам ничего не нужно настраивать самим.']],
  objection:'Студенты уже ищут, рассылают резюме и спрашивают знакомых. Размещение на InternShip показывает вашу вакансию студентам ШЦТ, которые ищут именно это.',
  secondTitle:'Есть место для стажёра?', secondSub:'Бесплатное размещение. Проверенные студенты ШЦТ. Одна воронка.', secondMicro:'Подтвердим вакансию в течение 1 рабочего дня.', benefits:['Бесплатное размещение','Проверенные студенты ШЦТ','Одна воронка'],
  founder:'Мы создали InternShip, потому что студенты ШЦТ в каждом интервью говорили одно и то же: они писали в десятки компаний, и большинство так и не ответили. А у компаний, готовых брать стажёров, не было канала, чтобы найти готовых студентов. Поэтому мы сделали размещение вакансии делом пяти минут — и каждый кандидат у нас проверенный студент ШЦТ Нархоз.',
  signoff:'',
 },
};
export const contentFor = (lang:Lang) => lang==='ru'?contentRu:content;
const faqRu = (view:View) => [
 ['eligibility',view==='student'?'Кто может откликаться?':'Кто будет откликаться на мою вакансию?','Студенты 3–4 курсов Школы цифровых технологий Нархоз всех программ: Cybersecurity, Digital Engineering, Digital Management and Design, Statistics and Data Science и Applied Mathematics in the Digital Economy. Студенты ШЦТ проходят две практики, поэтому на платформе оба курса.'],
 ['verification','Как проверяются компании?','В первой версии наша команда подключает каждую компанию через короткий звонок и форму, подтверждающую, что она берёт студентов, и фиксирует места и требования. Только после этого вакансия публикуется.'],
 ['paperwork','Помогаете с документами?','В каждой вакансии указано, может ли компания подписать документы университета о практике — чтобы студенты не узнали об этом после отклика.'],
 ['format','Как указаны оплата и формат?','В каждой вакансии: чем занимаются стажёры, отдел или стек, город и формат, оплачивается ли стажировка и сколько открыто мест.'],
 ['student-cost','Это платно для студентов?','Нет. Для студентов бесплатно.'],
 ['replies',view==='student'?'Что если компания не ответит?':'Что видят студенты после отклика?',view==='student'?'В вашей панели виден статус каждого отклика, и вы видите, какие компании просмотрели ваш профиль.':'В их панели виден статус каждого отклика, и они видят, какие компании просмотрели их профиль.'],
 ['company-cost','Сколько это стоит компаниям?','Бесплатно во время пилота.'],
 ['onboarding','Как подключаются компании?','В первой версии — через короткий звонок и форму с нашей командой.'],
];
export const faqs = (view:View, lang:Lang='en') => lang==='ru'?faqRu(view):faqEn(view);
const faqEn = (view:View) => [
 ['eligibility',view==='student'?'Who can apply?':'Who will apply to my listing?','3rd and 4th-year students of the Narxoz School of Digital Technologies, across all SDT programs: Cybersecurity, Digital Engineering, Digital Management and Design, Statistics and Data Science, and Applied Mathematics in the Digital Economy. SDT students complete two internships, which is why both years are on the platform.'],
 ['verification','How are companies verified?','In the first version our team onboards each company through a short call and a form that confirms it accepts students, and records its slots and requirements. Only then is the listing published.'],
 ['paperwork','Is the paperwork handled?','Every listing states whether the company can sign the university’s internship paperwork — so students don’t find out after applying.'],
 ['format','How are pay and format shown?','Every listing shows what interns do, the department or tech stack, location and format, whether the internship is paid, and how many slots are open.'],
 ['student-cost','Does it cost students anything?','No. Free for students.'],
 ['replies',view==='student'?'What if no company replies?':'What do students see after applying?','Your dashboard shows every application’s status, and you can see which companies have viewed your profile.'.replace('Your dashboard',view==='student'?'Your dashboard':'Their dashboard').replace('you can see which companies have viewed your profile',view==='student'?'you can see which companies have viewed your profile':'they can see which companies have viewed their profile')],
 ['company-cost','What does it cost companies?','Free during the pilot.'],
 ['onboarding','How do companies get onboarded?','In the first version, through a short call and a form with our team.'],
];
