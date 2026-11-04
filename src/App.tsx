import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './lib/supabase';

type Lang = 'en' | 'ru' | 'ka';
type Organization = { id: string; name: string; kind: 'restaurant' | 'supplier'; created_at: string };
const copy = {
  en: { title: 'Wines, Winemakers and Waiters', subtitle: 'A better way to sell wine', login: 'Sign in', email: 'Email', password: 'Password', submit: 'Sign in', signing: 'Signing in…', logout: 'Sign out', admin: 'WWW administrator', welcome: 'You are signed in and your administrator access is confirmed.', checking: 'Checking your access…', noRole: 'Your account is active, but no WWW role has been assigned yet.', config: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the Vercel project environment variables.', reset: 'Enter your email and password to continue.', organizations: 'Organizations', create: 'Create organization', orgName: 'Organization name', restaurant: 'Restaurant', supplier: 'Supplier', creating: 'Creating…', created: 'Organization created.' },
  ru: { title: 'Wines, Winemakers and Waiters', subtitle: 'Умнее продаём вино', login: 'Вход в систему', email: 'Email', password: 'Пароль', submit: 'Войти', signing: 'Входим…', logout: 'Выйти', admin: 'Администратор WWW', welcome: 'Вы вошли в систему. Права администратора подтверждены.', checking: 'Проверяем ваши права…', noRole: 'Аккаунт активен, но роль в WWW пока не назначена.', config: 'Supabase не настроен. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в переменные окружения проекта Vercel.', reset: 'Введите email и пароль для входа.', organizations: 'Организации', create: 'Создать организацию', orgName: 'Название организации', restaurant: 'Ресторан', supplier: 'Поставщик', creating: 'Создаём…', created: 'Организация создана.' },
  ka: { title: 'Wines, Winemakers and Waiters', subtitle: 'ღვინის გაყიდვის უკეთესი გზა', login: 'სისტემაში შესვლა', email: 'Email', password: 'პაროლი', submit: 'შესვლა', signing: 'შესვლა…', logout: 'გასვლა', admin: 'WWW ადმინისტრატორი', welcome: 'თქვენ შესული ხართ და ადმინისტრატორის უფლებები დადასტურებულია.', checking: 'უფლებების შემოწმება…', noRole: 'ანგარიში აქტიურია, მაგრამ WWW როლი ჯერ არ არის მინიჭებული.', config: 'Supabase არ არის კონფიგურირებული. Vercel-ში დაამატეთ VITE_SUPABASE_URL და VITE_SUPABASE_ANON_KEY.', reset: 'გასაგრძელებლად შეიყვანეთ ელფოსტა და პაროლი.', organizations: 'ორგანიზაციები', create: 'ორგანიზაციის შექმნა', orgName: 'ორგანიზაციის სახელი', restaurant: 'რესტორანი', supplier: 'მომწოდებელი', creating: 'იქმნება…', created: 'ორგანიზაცია შეიქმნა.' }
};

export default function App() {
  const [lang, setLang] = useState<Lang>('ru');
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgName, setOrgName] = useState('');
  const [orgKind, setOrgKind] = useState<'restaurant' | 'supplier'>('restaurant');
  const [orgBusy, setOrgBusy] = useState(false);
  const t = copy[lang];

  useEffect(() => {
    if (!supabase) { setBusy(false); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) setMessage(error.message);
      setSession(data.session);
      setBusy(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!alive) return;
      setSession(nextSession);
      setIsAdmin(null);
      setMessage('');
      setBusy(false);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase || !session) { setIsAdmin(null); return; }
    let alive = true;
    supabase.rpc('is_platform_admin').then(({ data, error }) => {
      if (!alive) return;
      setIsAdmin(error ? false : Boolean(data));
      if (error) setMessage(error.message);
    });
    return () => { alive = false; };
  }, [session]);


  useEffect(() => {
    if (!supabase || !session || isAdmin !== true) return;
    let alive = true;
    supabase.from('organizations').select('id,name,kind,created_at').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setMessage(error.message);
        else setOrganizations((data ?? []) as Organization[]);
      });
    return () => { alive = false; };
  }, [session, isAdmin]);

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !orgName.trim()) return;
    setOrgBusy(true);
    setMessage('');
    const { data, error } = await supabase.from('organizations')
      .insert({ name: orgName.trim(), kind: orgKind })
      .select('id,name,kind,created_at')
      .single();
    if (error) setMessage(error.message);
    else if (data) {
      setOrganizations(current => [data as Organization, ...current]);
      setOrgName('');
      setMessage(lang === 'ru' ? 'Организация создана.' : lang === 'ka' ? 'ორგანიზაცია შეიქმნა.' : 'Organization created.');
    }
    setOrgBusy(false);
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSubmitting(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setMessage(error.message);
    setSubmitting(false);
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message);
    setIsAdmin(null);
  }

  return <div className="app auth-app">
    <header>
      <div className="brand"><div className="mark">🍷</div><div><b>WWW</b><small>WINES · WINEMAKERS · WAITERS</small></div></div>
      <select aria-label="Language" value={lang} onChange={e => setLang(e.target.value as Lang)}><option value="en">EN</option><option value="ru">RU</option><option value="ka">KA</option></select>
    </header>
    <main>
      <div className="eyebrow">WINE SALES INCENTIVES</div>
      <h1>{t.title}</h1>
      <p className="sub">{t.subtitle}</p>
      {!isSupabaseConfigured ? <div className="auth-message error">{t.config}</div> :
        busy ? <div className="auth-panel">{t.checking}</div> :
        !session ? <form className="auth-panel" onSubmit={signIn}>
          <h2>{t.login}</h2>
          <p>{t.reset}</p>
          <label>{t.email}<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label>{t.password}<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></label>
          <button className="btn primary wide" type="submit" disabled={submitting}>{submitting ? t.signing : t.submit}</button>
        </form> :
        <section className="auth-panel">
          <div className="auth-status"><span className="status-dot" />{session.user.email}</div>
          {isAdmin === null ? <p>{t.checking}</p> : isAdmin ? <>
            <div className="admin-mark">WWW</div><h2>{t.admin}</h2><p>{t.welcome}</p>
            <div className="admin-section">
              <h2>{t.organizations}</h2>
              <form onSubmit={createOrganization}>
                <label>{t.orgName}<input required value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Wine House Tbilisi" /></label>
                <label>Type<select value={orgKind} onChange={e => setOrgKind(e.target.value as 'restaurant' | 'supplier')}><option value="restaurant">{t.restaurant}</option><option value="supplier">{t.supplier}</option></select></label>
                <button className="btn primary wide" type="submit" disabled={orgBusy || !orgName.trim()}>{orgBusy ? t.creating : t.create}</button>
              </form>
              <div className="org-list">{organizations.map(org => <div className="org-row" key={org.id}><div><b>{org.name}</b><small>{org.kind === 'restaurant' ? t.restaurant : t.supplier}</small></div><span>{org.kind === 'restaurant' ? '🍽️' : '🍇'}</span></div>)}{organizations.length === 0 && <p>{t.empty}</p>}</div>
            </div>
          </> : <><h2>{t.login}</h2><p>{t.noRole}</p></>}
          <button className="btn quiet wide" onClick={signOut}>{t.logout}</button>
        </section>
      }
      {message && <div className="auth-message error">{message}</div>}
    </main>
    <footer>WWW · WINE SALES INCENTIVES <span>EARLY ACCESS</span></footer>
  </div>;
}
