import {useState, type FormEvent} from 'react';
import {useServerFn} from '@tanstack/react-start';
import {ArrowRight, CheckCircle2, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog, DialogContent, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {contentFor, submissionSchema, type View} from '@/lib/internship-content';
import {useLang, useT} from '@/lib/i18n';
import {submitPilot} from '@/lib/pilot.functions';
import {track} from '@/lib/landing-analytics';

export function PilotForm({view,placement}:{view:View;placement:'hero'|'footer'}){
 const lang=useLang(); const t=useT(); const f=t.pilotForm; const copy=contentFor(lang)[view]; const save=useServerFn(submitPilot);
 
 // Добавили состояние для имени
 const [name, setName] = useState('');
 const [email,setEmail]=useState('');const [modal,setModal]=useState<'listing'|'call_request'|null>(null);const [busy,setBusy]=useState(false);const [status,setStatus]=useState('');const [success,setSuccess]=useState(false);

 async function send(kind:'signup'|'listing'|'call_request',details:Record<string,string>={}){
  // Если это студент, добавляем имя в details
  const payloadDetails = kind === 'signup' ? { ...details, full_name: name } : details;
  
  const parsed=submissionSchema.safeParse({email,audience:view,kind,details: payloadDetails});
  if(!parsed.success){setStatus(parsed.error.issues[0]?.path[0]==='email'&&lang==='ru'?f.narxozTitle:parsed.error.issues[0]?.message??f.checkInfo);return;}
  setBusy(true);setStatus('');
  try{
    const result=await save({data:parsed.data});
    if(!result.ok){setStatus(lang==='ru'?f.saveFailed:result.error??f.tryAgain);return;}
    
    setSuccess(true);
    setModal(null);
    setStatus(kind==='signup'?f.signupOk:kind==='listing'?f.listingOk:f.callOk);
    
    // Supabase tracking
    track(kind==='signup'?'email_submit':kind==='listing'?'listing_form_submit':'call_requested',{view});
    
    // GA4 tracking - sign_up
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'sign_up', { method: 'email', audience: view });
    }
  }catch{
    setStatus(f.saveFailed);
  }finally{
    setBusy(false);
  }
 }

 function start(event:FormEvent<HTMLFormElement>){
   event.preventDefault();
   if (busy) return;
   if(view==='student') void send('signup');
   else { track('listing_form_start',{view}); setModal('listing'); }
 }

 function submitDetails(event:FormEvent<HTMLFormElement>){
   event.preventDefault();
   if (busy) return;
   const entries=new FormData(event.currentTarget);
   const details:Record<string,string>={};
   for(const [key,value]of entries){if(typeof value==='string')details[key]=value;}
   if(modal)void send(modal,details);
 }

 return (
 <><form className="signup" onSubmit={start}>
   
   {/* Обертка для полей ввода (Name и Email), чтобы они стояли друг под другом */}
   <div className="flex flex-col gap-3 w-full mb-3">
     
     {view === 'student' && (
       <div className="w-full">
         <label className="sr-only" htmlFor={`name-${placement}`}>{f.name}</label>
         <Input
           id={`name-${placement}`}
           type="text"
           placeholder={f.name}
           required
           maxLength={100}
           autoComplete="name"
           value={name}
           onChange={e => setName(e.target.value)}
           disabled={busy}
           className="w-full bg-white"
         />
       </div>
     )}

     <div className="w-full">
       <label className="sr-only" htmlFor={`email-${placement}`}>{view==='company'?f.workEmail:f.yourEmail}</label>
       <Input
        id={`email-${placement}`}
        className="email-input w-full bg-white"
        type="email"
        placeholder={view === 'company' ? f.workEmailPh : f.uniEmailPh}
        required
        maxLength={254}
        autoComplete="email"
        pattern={view === 'student' ? '.+@narxoz\\.kz$' : undefined}
        title={view === 'student' ? f.narxozTitle : undefined}
        value={email}
        onChange={e => { setEmail(e.target.value); setSuccess(false); setStatus(''); }}
        disabled={busy}
       />
     </div>
   </div>

   <Button variant="notice" type="submit" disabled={busy} className="w-full" onClick={()=>{
     track('cta_click',{cta_id:`${view}_${placement}`});
     // GA4 tracking - cta_click
     if (typeof window !== 'undefined' && (window as any).gtag) {
       (window as any).gtag('event', 'cta_click', { cta_id: `${view}_${placement}`, view: view });
     }
   }}>
     {busy?<Loader2 className="animate-spin"/>:null}{copy.cta}<ArrowRight/>
   </Button>
 </form>
 
 <p className="microcopy">{placement==='hero'?copy.micro:copy.secondMicro}</p>
 {view==='company'&&placement==='hero'&&<Button variant="ghost" className="h-auto p-0 font-mono text-xs underline underline-offset-4" onClick={()=>{setModal('call_request');setStatus('');}}>{f.bookCall} <ArrowRight/></Button>}
 {status&&<p role={success?'status':'alert'} className={`form-status ${success?'success':''}`}>{success&&<CheckCircle2 className="inline mr-1" size={16}/>} {status}</p>}
 
 <Dialog open={modal!==null} onOpenChange={open=>{if(!open)setModal(null);}}><DialogContent className="notice-dialog"><DialogTitle className="font-display text-2xl">{modal==='listing'?f.listingTitle:f.callTitle}</DialogTitle><DialogDescription>{modal==='listing'?f.listingDesc:f.callDesc}</DialogDescription><form className="listing-fields" onSubmit={submitDetails}><div><label className="field-label" htmlFor={`modal-email-${placement}`}>{f.workEmail}</label><Input id={`modal-email-${placement}`} type="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254}/></div>
 {modal==='listing'?<><Field name="company" label={f.companyName}/><Field name="title" label={f.internshipTitle}/><div><label className="field-label" htmlFor={`tasks-${placement}`}>{f.tasks}</label><textarea id={`tasks-${placement}`} name="tasks" required maxLength={2000}/></div><Field name="stack" label={f.stack}/><Field name="contact" label={f.contact}/><div className="grid grid-cols-2 gap-3"><Field name="location" label={f.location}/><Field name="pay" label={f.pay}/></div><div className="grid grid-cols-2 gap-3"><div><label className="field-label" htmlFor={`format-${placement}`}>{f.format}</label><select id={`format-${placement}`} name="format" defaultValue="hybrid"><option value="office">{t.format["office"]}</option><option value="hybrid">{t.format["hybrid"]}</option><option value="remote">{t.format["remote"]}</option></select></div><Field name="slots" label={f.slots} type="number"/></div></>:<><Field name="company" label={f.companyName}/><Field name="contact" label={f.yourName}/><Field name="preferred_time" label={f.preferredTime}/></>}
 <label className="text-xs leading-relaxed flex items-start gap-2"><input type="checkbox" required className="mt-1 shrink-0"/>{modal==='listing'?f.consentListing:f.consentCall}</label>
 {!success&&status&&<p role="alert" className="text-sm">{status}</p>}<Button variant="notice" type="submit" disabled={busy}>{busy?f.sending:modal==='listing'?f.submitListing:f.requestCall}<ArrowRight/></Button></form></DialogContent></Dialog></>);
 
 function Field({name,label,type='text'}:{name:string;label:string;type?:string}){return <div><label className="field-label" htmlFor={`${name}-${placement}`}>{label}</label><input id={`${name}-${placement}`} name={name} type={type} required min={type==='number'?1:undefined} step={type==='number'?1:undefined} maxLength={200} defaultValue={type==='number'?'1':undefined}/></div>}
}