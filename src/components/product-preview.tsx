import {Check, Send} from 'lucide-react';
import type {View} from '@/lib/internship-content';
import {useT} from '@/lib/i18n';
export function Verified(){const t=useT();return <span className="verified"><Check aria-hidden="true"/>{t.preview.verified}</span>}
export function ProgressPath({className=''}:{className?:string}){
 const t=useT();const nodes=['Sent','Viewed','Interview','Offer','Declined'];
 return <div className={`progress-path ${className}`} aria-hidden="true"><span className="path-line"/>{nodes.map((n,i)=><span key={n} className={`path-node ${i<3?'done':''} ${n==='Offer'?'offer':''}`}><i>{i<3||n==='Offer'?<Check/>:null}</i>{t.status[n]}</span>)}</div>;
}
export function ProductPreview({view}:{view:View}){
 const t=useT();const p=t.preview;const company=view==='company';
 const jobs:[string,string,string,string,string,number][]=[['N',p.fields[0]?.[1]??'','Nova Digital','React · TypeScript',p.paidHybrid,2],['Q','Data analyst intern','Qazaq Data','Python · SQL',p.paidOffice,1]];
 const apps:[string,string][]=[['Nova Digital','Interview'],['Qazaq Data','Viewed'],['Steppe Soft','Sent'],['Alatau Labs','Offer']];
 const applicants:[string,string,string][]=[['A.','Digital Management and Design','Interview'],['D.','Digital Engineering','Viewed'],['S.','Statistics and Data Science','Sent']];
 return <div className="product-scene" role="img" aria-label={company?p.labelCompany:p.labelStudent}>
  <div className="soft-card mock-main"><div className="mock-head">{company?p.newSlot:p.catalogue}</div>
  {company?<div className="mock-form">{p.fields.map(([l,v])=><div className="mock-field" key={l}><span>{l}</span>{v}</div>)}<div className="mock-save">{p.submit}</div></div>
  :jobs.map(j=><div className="job" key={j[0]}><div className="job-top"><span className="company-logo">{j[0]}</span><div><div className="job-name">{j[1]}</div><div className="job-company">{j[2]} · Almaty</div></div></div><Verified/><div className="tags"><span>{j[3]}</span><span>{j[4]}</span><span>{p.slot(j[5])}</span></div><div className="job-company">{p.paperwork}</div></div>)}
  </div>
  <div className="soft-card mock-side"><div className="mock-head">{company?p.applicants:p.myApps}</div>
  {company?applicants.map(([n,prog,s])=><div className="app-row" key={n}><span>{n} · {prog}</span><b className={`status s-${s.toLowerCase()}`}>{t.status[s]}</b></div>)
  :apps.map(([c,s])=><div className="app-row" key={c}><span>{c}</span><b className={`status s-${s.toLowerCase()}`}>{t.status[s]}</b></div>)}
  </div>
  <div className="soft-card telegram"><span className="telegram-icon"><Send size={14}/></span><div><strong>InternShip · Telegram</strong><p>{company?p.tgCompany:p.tgStudent}</p></div></div>
  <p className="mock-note">{p.note}</p>
 </div>;
}
