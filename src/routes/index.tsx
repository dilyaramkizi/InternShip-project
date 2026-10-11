import {createFileRoute, Link, useNavigate} from '@tanstack/react-router';
import {useEffect, useRef, type KeyboardEvent} from 'react';
import {ArrowRight, Check, ClipboardList, FileText, Layers, LayoutDashboard, Send, ShieldCheck, GraduationCap, Quote} from 'lucide-react';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {PilotForm} from '@/components/pilot-form';
import {ProductPreview, ProgressPath} from '@/components/product-preview';
import {content, faqs, parseView, type View} from '@/lib/internship-content';
import {track} from '@/lib/landing-analytics';
export const Route=createFileRoute('/')({
 validateSearch:(search:Record<string,unknown>)=>({view:parseView(search['view'])}),
 head:({match})=>{const view=parseView(match.search.view);const title=view==='company'?'InternShip — List internship slots for Narxoz SDT students':'InternShip — Verified internships for Narxoz SDT students';const description=view==='company'?'Publish internship slots for 3rd and 4th-year Narxoz School of Digital Technologies students. Free during the pilot.':'One profile, verified companies that take interns, and every application tracked in one dashboard with Telegram alerts.';return {meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]};},
 component:Index,
});
const icons={student:[FileText,ShieldCheck,Layers,LayoutDashboard,Send,ClipboardList],company:[FileText,ShieldCheck,ClipboardList,LayoutDashboard,Send,Layers]};
function Toggle({view,onChange,className=''}:{view:View;onChange:(v:View)=>void;className?:string}){
 const refs=useRef<(HTMLButtonElement|null)[]>([]);
 const opts:[View,string][]=[['student','I’m a student'],['company','I’m a company']];
 function key(e:KeyboardEvent){if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();const next:View=view==='student'?'company':'student';onChange(next);refs.current[next==='student'?0:1]?.focus();}
 return <div className={`segmented ${className}`} role="group" aria-label="Choose your side">{opts.map(([v,l],i)=><button key={v} ref={el=>{refs.current[i]=el;}} type="button" aria-pressed={view===v} tabIndex={view===v?0:-1} onKeyDown={key} onClick={()=>onChange(v)}>{l}</button>)}</div>;
}
function useReveal(dep:string){useEffect(()=>{const els=document.querySelectorAll('.reveal');const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.15});els.forEach(el=>io.observe(el));return()=>io.disconnect();},[dep]);}
function Index(){
 const {view}=Route.useSearch();const navigate=useNavigate();const copy=content[view];
 useEffect(()=>{track('page_view',{view});},[view]);
 useReveal(view);
 function change(to:View){if(to===view)return;track('toggle_switch',{from:view,to});void navigate({to:'/',search:{view:to},resetScroll:false});}
 return <>
 <header className="site-header"><div className="wrap header-inner"><Link to="/" search={{view}} className="brand" aria-label="InternShip home"><span className="brand-icon"><GraduationCap size={20}/></span>InternShip</Link><Toggle view={view} onChange={change} className="header-toggle"/></div></header>
 <main key={view} className="view-fade">
  <section className="toggle-band"><div className="wrap"><p className="label">Choose your side. You can switch anytime.</p><Toggle view={view} onChange={change}/></div></section>
  <div className="wrap">
   <section className="hero"><div className="hero-copy"><h1>{copy.title}</h1><p className="hero-sub">{copy.subtitle}</p><PilotForm view={view} placement="hero"/></div><ProductPreview view={view}/></section>
  </div>
  <section className="section band-sand"><div className="wrap"><ProgressPath className="reveal"/>
   <h2 className="section-heading">{view==='student'?'What students told us.':'Your first company quotes go here.'}</h2>
   {copy.quotesPlaceholder&&<p className="section-intro">Placeholders — to be replaced with real company interviewee words after the 25-company test.</p>}
   <div className={`quotes ${copy.quotes.length>3?'six':''}`}>{copy.quotes.map(q=><figure className="soft-card quote reveal" key={q}><Quote aria-hidden="true"/><blockquote>{q}</blockquote>{copy.quotesPlaceholder&&<figcaption className="label">Placeholder</figcaption>}</figure>)}</div>
   <p className="stat-line">{copy.stat}</p></div></section>
  <section className="section"><div className="wrap"><h2 className="section-heading">{view==='student'?'The internship search, made easier.':'Interns, without a second job in hiring.'}</h2>
   <div className="feature-head label" aria-hidden="true"><span>Feature</span><span>What you’re thinking</span><span>Our answer</span></div>
   <div className="features">{copy.features.map(([name,obj,ans],i)=>{const Icon=icons[view][i]??Check;return <div className="soft-card feature reveal" key={name}><div className="feature-name"><span className="icon-dot"><Icon/></span>{name}</div><blockquote>{obj}</blockquote><p>{ans}</p></div>;})}</div>
   <div className="objection reveal">{copy.objection}</div></div></section>
  <section className="section band-sand"><div className="wrap"><div className="faq"><h2 className="section-heading">Good questions. Straight answers.</h2>
   <Accordion type="single" collapsible className="faq-list" onValueChange={id=>{if(id)track('faq_open',{question_id:id,view});}}>{faqs(view).map(([id,q,a])=><AccordionItem value={id ?? 'q'} key={id}><AccordionTrigger className="faq-trigger">{q}</AccordionTrigger><AccordionContent className="faq-content">{a}</AccordionContent></AccordionItem>)}</Accordion></div></div></section>
  <section className="section final-cta"><div className="wrap"><h2 className="section-heading">{copy.secondTitle}</h2><p className="section-intro">{copy.secondSub}</p><PilotForm view={view} placement="footer"/><div className="benefits">{copy.benefits.map(b=><span key={b}><Check aria-hidden="true"/>{b}</span>)}</div></div></section>
  <section className="section band-sand"><div className="wrap"><div className="founder"><h2 className="section-heading">A note from the team</h2><p>{copy.founder}</p><div className="signature">— The InternShip team</div>{copy.signoff&&<div className="label">{copy.signoff}</div>}</div></div></section>
 </main>
 <footer className="site-footer"><div className="wrap footer-inner"><div className="brand">InternShip <ArrowRight size={20}/></div><div className="label">Narxoz School of Digital Technologies · Almaty · Pilot</div><div className="label">© 2026 InternShip</div></div></footer>
 </>;
}
