import {useEffect, type ReactNode} from 'react';
import {Link, useNavigate} from '@tanstack/react-router';
import {Loader2} from 'lucide-react';
import {SiteFooter, SiteHeader} from '@/components/site-chrome';
import {useT} from '@/lib/i18n';
import {dashboardPath, useAuth, type Profile, type Role} from '@/lib/use-auth';

/** Signs visitors in before showing a dashboard, and keeps each role on its own dashboard. */
export function DashboardShell({role,children}:{role:Role;children:(profile:Profile)=>ReactNode}){
 const t=useT();const navigate=useNavigate();const {loading,session,profile}=useAuth();
 useEffect(()=>{if(!loading&&!session)void navigate({to:'/auth',search:{mode:'signin',role},replace:true});},[loading,session,role,navigate]);
 let body:ReactNode;
 if(loading||!session)body=<p className="dash-loading"><Loader2 className="animate-spin"/>{t.dash.loading}</p>;
 else if(!profile)body=<p className="dash-loading">{t.dash.loadFailed}</p>;
 else if(profile.role!==role)body=<div className="dash-loading"><p>{t.dash.wrongRole}</p><Link className="account-cta" to={dashboardPath(profile.role)}>{t.dash.goToMine}</Link></div>;
 else body=children(profile);
 return <><SiteHeader/><main className="wrap dash">{body}</main><SiteFooter/></>;
}
