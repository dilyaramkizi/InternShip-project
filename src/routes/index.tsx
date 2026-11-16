import {createFileRoute, Link, useNavigate} from '@tanstack/react-router';
import {useEffect, useRef, type KeyboardEvent} from 'react';
import {ArrowRight, Check, ClipboardList, FileText, Layers, LayoutDashboard, Send, ShieldCheck, Quote} from 'lucide-react';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {PilotForm} from '@/components/pilot-form';
import {ProductPreview, ProgressPath} from '@/components/product-preview';
import {SiteFooter, SiteHeader} from '@/components/site-chrome';
import {contentFor, faqs, parseView, type View} from '@/lib/internship-content';
import {parseLang, useLang, useT} from '@/lib/i18n';
import {track} from '@/lib/landing-analytics';
import {trackSectionVisibility} from '@/lib/section-tracker';
export const Route=createFileRoute('/')({
 validateSearch:(search:Record<string,unknown>)=>({view:parseView(search['view'])}),
 head:({match})=>{const view=parseView(match.search.view);const ru=parseLang((match.search as {lang?:unknown}).lang)==='ru';const title=view==='company'?(ru?'InternShip — стажировки для студентов ШЦТ Нархоз':'InternShip — List internship slots for Narxoz SDT students'):(ru?'InternShip — проверенные стажировки для студентов ШЦТ Нархоз':'InternShip — Verified internships for Narxoz SDT students');const description=view==='company'?(ru?'Публикуйте стажировки для студентов 3–4 курсов Школы цифровых технологий Нархоз. Бесплатно во время пилота.':'Publish internship slots for 3rd and 4th-year Narxoz School of Digital Technologies students. Free during the pilot.'):(ru?'Один профиль, проверенные компании, которые берут стажёров, и все отклики в одной панели.':'One profile, verified companies that take interns, and every application tracked in one dashboard with Telegram alerts.');return {meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]};},
 component:Index,
});
const icons={student:[FileText,ShieldCheck,Layers,LayoutDashboard,Send,ClipboardList],company:[FileText,ShieldCheck,ClipboardList,LayoutDashboard,Send,Layers]};
function Toggle({view,onChange,className=''}:{view:View;onChange:(v:View)=>void;className?:string}){
 const t=useT();const refs=useRef<(HTMLButtonElement|null)[]>([]);
 const opts:[View,string][]=[['student',t.nav.student],['company',t.nav.company]];
 function key(e:KeyboardEvent){if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();const next:View=view==='student'?'company':'student';onChange(next);refs.current[next==='student'?0:1]?.focus();}
 return <div className={`segmented ${className}`} role="group" aria-label={t.nav.sideGroup}>{opts.map(([v,l],i)=><button key={v} ref={el=>{refs.current[i]=el;}} type="button" aria-pressed={view===v} tabIndex={view===v?0:-1} onKeyDown={key} onClick={()=>onChange(v)}>{l}</button>)}</div>;
}
function useReveal(dep:string){useEffect(()=>{const els=document.querySelectorAll('.reveal');const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.15});els.forEach(el=>io.observe(el));return()=>io.disconnect();},[dep]);}
function Index(){
 const {view}:{view:View}=Route.useSearch();const navigate=useNavigate();const lang=useLang();const t=useT();const copy=contentFor(lang)[view];
 useEffect(()=>{track('page_view',{view});},[view]);
 useReveal(`${view}-${lang}`);
 useEffect(()=>trackSectionVisibility(view),[view]);
 function change(to:View){if(to===view)return;track('toggle_switch',{from:view,to});void navigate({to:'/',search:{view:to},resetScroll:false});}
 return <>
 <SiteHeader><Toggle view={view} onChange={change} className="header-toggle"/></SiteHeader>
 <main key={`${view}-${lang}`} className="view-fade">
  <section className="toggle-band"><div className="wrap"><p className="label">{t.landing.chooseSide}</p><Toggle view={view} onChange={change}/></div></section>
  <div className="wrap">
   <section className="hero" data-section="hero"><div className="hero-copy"><h1>{copy.title}</h1><p className="hero-sub">{copy.subtitle}</p><PilotForm view={view} placement="hero"/>
    <Link to="/auth" search={{mode:'signup',role:view}} className="account-cta">{view==='student'?t.landing.accountStudent:t.landing.accountCompany}<ArrowRight size={16}/></Link></div><ProductPreview view={view}/></section>
  </div>
  <section className="section band-sand" data-section="quotes"><div className="wrap"><ProgressPath className="reveal"/>
   <h2 className="section-heading">{view==='student'?t.landing.quotesStudent:t.landing.quotesCompany}</h2>
   {copy.quotesPlaceholder&&<p className="section-intro">{t.landing.quotesPlaceholder}</p>}
   <div className={`quotes ${copy.quotes.length>3?'six':''}`}>{copy.quotes.map(q=><figure className="soft-card quote reveal" key={q}><Quote aria-hidden="true"/><blockquote>{q}</blockquote>{copy.quotesPlaceholder&&<figcaption className="label">{t.landing.placeholder}</figcaption>}</figure>)}</div>
   <p className="stat-line">{copy.stat}</p></div></section>
  <section className="section" data-section="features"><div className="wrap"><h2 className="section-heading">{view==='student'?t.landing.featuresStudent:t.landing.featuresCompany}</h2>
   <div className="feature-head label" aria-hidden="true">{t.landing.featureHead.map(h=><span key={h}>{h}</span>)}</div>
   <div className="features">{copy.features.map(([name,obj,ans],i)=>{const Icon=icons[view][i]??Check;return <div className="soft-card feature reveal" key={name}><div className="feature-name"><span className="icon-dot"><Icon/></span>{name}</div><blockquote>{obj}</blockquote><p>{ans}</p></div>;})}</div>
   <div className="objection reveal">{copy.objection}</div></div></section>
  <section className="section band-sand" data-section="faq"><div className="wrap"><div className="faq"><h2 className="section-heading">{t.landing.faqTitle}</h2>
   <Accordion type="single" collapsible className="faq-list" onValueChange={id=>{if(id)track('faq_open',{question_id:id,view});}}>{faqs(view,lang).map(([id,q,a])=><AccordionItem value={id ?? 'q'} key={id}><AccordionTrigger className="faq-trigger">{q}</AccordionTrigger><AccordionContent className="faq-content">{a}</AccordionContent></AccordionItem>)}</Accordion></div></div></section>
  <section className="section final-cta" data-section="final_cta"><div className="wrap"><h2 className="section-heading">{copy.secondTitle}</h2><p className="section-intro">{copy.secondSub}</p><PilotForm view={view} placement="footer"/><div className="benefits">{copy.benefits.map(b=><span key={b}><Check aria-hidden="true"/>{b}</span>)}</div>
   <p className="account-line">{t.landing.accountLine} <Link to="/auth" search={{mode:'signup',role:view}}>{t.nav.signUp} <ArrowRight size={14}/></Link></p></div></section>
  <section className="section band-sand" data-section="founder_note"><div className="wrap"><div className="founder"><h2 className="section-heading">{t.landing.founderTitle}</h2><p>{copy.founder}</p>
   <ul className="founders" aria-label={t.team.name}>{t.team.members.map(([name,role])=><li key={name}><span className="founder-avatar" aria-hidden="true">{name[0]}</span><span><strong>{name}</strong><span className="label">{role} · {t.team.name}</span></span></li>)}</ul>
   <div className="signature">{t.team.signature}</div>{copy.signoff&&<div className="label">{copy.signoff}</div>}</div></div></section>
 </main>
 <SiteFooter/>
 </>;
}
