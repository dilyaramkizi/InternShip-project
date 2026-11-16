import {Mail, MapPin, Phone, Send} from 'lucide-react';
import {splitLines, splitList, type Cv} from '@/lib/cv';
import {useT} from '@/lib/i18n';

/** The printable CV. Students see it as a live preview; companies open it from the applicant list. */
export function CvDocument({cv,email}:{cv:Cv;email?:string}){
 const s=useT().student.cvSections;
 const skills=splitList(cv.skills);
 const meta=[cv.program,cv.year?s.year(cv.year):'',cv.gpa!=null?`${s.gpa} ${cv.gpa.toFixed(2)}`:''].filter(Boolean).join(' · ');
 function Block({title,lines}:{title:string;lines:string[]}){return lines.length?<section className="cv-block"><h3>{title}</h3><ul>{lines.map((l,i)=><li key={i}>{l}</li>)}</ul></section>:null;}
 return <article className="cv-paper">
  <header className="cv-head"><h2>{cv.full_name||'—'}</h2>{cv.headline&&<p className="cv-headline">{cv.headline}</p>}{meta&&<p className="cv-meta">{meta}</p>}
   <div className="cv-contacts">{email&&<span><Mail size={13}/>{email}</span>}{cv.phone&&<span><Phone size={13}/>{cv.phone}</span>}{cv.telegram&&<span><Send size={13}/>{cv.telegram}</span>}<span><MapPin size={13}/>Almaty</span></div></header>
  {cv.summary&&<section className="cv-block"><h3>{s.summary}</h3><p>{cv.summary}</p></section>}
  {skills.length>0&&<section className="cv-block"><h3>{s.skills}</h3><div className="tags">{skills.map(k=><span key={k}>{k}</span>)}</div></section>}
  <Block title={s.experience} lines={splitLines(cv.experience)}/>
  <Block title={s.projects} lines={splitLines(cv.projects)}/>
  <Block title={s.education} lines={splitLines(cv.education)}/>
  <Block title={s.languages} lines={splitList(cv.languages).length?[splitList(cv.languages).join(', ')]:[]}/>
  <Block title={s.links} lines={splitList(cv.links)}/>
 </article>;
}
