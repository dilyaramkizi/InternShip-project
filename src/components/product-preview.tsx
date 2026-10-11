import {Check, Send} from 'lucide-react';
import type {View} from '@/lib/internship-content';
export function Verified(){return <span className="verified"><Check aria-hidden="true"/>Verified by Narxoz</span>}
export function ProgressPath({className=''}:{className?:string}){
 const nodes=['Sent','Viewed','Interview','Offer','Declined'];
 return <div className={`progress-path ${className}`} aria-hidden="true"><span className="path-line"/>{nodes.map((n,i)=><span key={n} className={`path-node ${i<3?'done':''} ${n==='Offer'?'offer':''}`}><i>{i<3||n==='Offer'?<Check/>:null}</i>{n}</span>)}</div>;
}
const jobs=[['N','Frontend developer intern','Nova Digital','React · TypeScript','Paid · Hybrid','2 slots','Can sign paperwork'],['Q','Data analyst intern','Qazaq Data','Python · SQL','Paid · Office','1 slot','Can sign paperwork']];
const apps=[['Nova Digital','Interview'],['Qazaq Data','Viewed'],['Steppe Soft','Sent'],['Alatau Labs','Offer']];
export function ProductPreview({view}:{view:View}){
 const company=view==='company';
 return <div className="product-scene" role="img" aria-label={company?'Illustrative listing form and candidate pipeline':'Illustrative internship catalogue and application dashboard'}>
  <div className="soft-card mock-main"><div className="mock-head">{company?'New internship slot':'Internships · Almaty'}</div>
  {company?<div className="mock-form">{[['Internship title','Frontend developer intern'],['Tasks & tech stack','Build client UI · React, TypeScript'],['Location · format · pay','Almaty · Hybrid · Paid'],['Open slots · contact person','2 slots · Hiring lead'],['University paperwork','Can sign ✓']].map(([l,v])=><div className="mock-field" key={l}><span>{l}</span>{v}</div>)}<div className="mock-save">Submit for review</div></div>
  :jobs.map(j=><div className="job" key={j[0]}><div className="job-top"><span className="company-logo">{j[0]}</span><div><div className="job-name">{j[1]}</div><div className="job-company">{j[2]} · Almaty</div></div></div><Verified/><div className="tags"><span>{j[3]}</span><span>{j[4]}</span><span>{j[5]}</span></div><div className="job-company">{j[6]}</div></div>)}
  </div>
  <div className="soft-card mock-side"><div className="mock-head">{company?'Applicants · 3':'My applications'}</div>
  {company?[['A.','Digital Management and Design','Interview'],['D.','Digital Engineering','Viewed'],['S.','Statistics and Data Science','Sent']].map(([n,p,s])=><div className="app-row" key={n}><span>{n} · {p}</span><b className={`status s-${s.toLowerCase()}`}>{s}</b></div>)
  :apps.map(([c,s])=><div className="app-row" key={c}><span>{c}</span><b className={`status s-${s.toLowerCase()}`}>{s}</b></div>)}
  </div>
  <div className="soft-card telegram"><span className="telegram-icon"><Send size={14}/></span><div><strong>InternShip · Telegram</strong><p>{company?'New applicant for Frontend developer intern.':'Your application status changed.'}</p></div></div>
  <p className="mock-note">Illustrative product preview · not live listings</p>
 </div>;
}
