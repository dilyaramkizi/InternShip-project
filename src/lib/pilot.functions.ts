import {createServerFn} from '@tanstack/react-start';
import {createClient} from '@supabase/supabase-js';
import {submissionSchema} from './internship-content';
import type {Database} from '@/integrations/supabase/types';
export const submitPilot = createServerFn({method:'POST'}).inputValidator((input:unknown)=>submissionSchema.parse(input)).handler(async ({data})=>{
 const key=process.env['SUPABASE_PUBLISHABLE_KEY'];
 const url=process.env['SUPABASE_URL'];
 if(!key || !url) return {ok:false,error:'Signups are temporarily unavailable. Please try again shortly.'};
 const client=createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers);if(key.startsWith('sb_') && headers.get('Authorization')===`Bearer ${key}`)headers.delete('Authorization');headers.set('apikey',key);return fetch(input,{...init,headers});}}});
 const {error}=await client.from('pilot_submissions').insert(data);
 if(error) return {ok:false,error:'We couldn’t save your request. Please try again.'};
 return {ok:true,error:null};
});
