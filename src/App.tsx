import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './lib/supabase';

type Lang = 'en' | 'ru' | 'ka';
type Organization = { id: string; name: string; kind: 'restaurant' | 'supplier' | 'winemaker'; contact_first_name?: string | null; contact_last_name?: string | null; contact_phone?: string | null; created_at: string; archived_at?: string | null };
type ManagerInfo = { id: string; first_name: string; last_name: string; phone: string | null };
const copy = {
  en: { title: 'Wines, Winemakers and Waiters', subtitle: 'A better way to sell wine', login: 'Sign in', email: 'Email', password: 'Password', submit: 'Sign in', signing: 'Signing in…', logout: 'Sign out', admin: 'WWW administrator', welcome: 'You are signed in and your administrator access is confirmed.', checking: 'Checking your access…', noRole: 'Your account is active, but no WWW role has been assigned yet.', config: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the Vercel project environment variables.', reset: 'Enter your email and password to continue.', organizations: 'Organizations', create: 'Create organization', orgName: 'Organization name', restaurant: 'Restaurant', supplier: 'Supplier', winemaker: 'Winemaker', creating: 'Creating…', created: 'Organization created.', empty: 'No organizations yet.' },
  ru: { title: 'Wines, Winemakers and Waiters', subtitle: 'Умнее продаём вино', login: 'Вход в систему', email: 'Email', password: 'Пароль', submit: 'Войти', signing: 'Входим…', logout: 'Выйти', admin: 'Администратор WWW', welcome: 'Вы вошли в систему. Права администратора подтверждены.', checking: 'Проверяем ваши права…', noRole: 'Аккаунт активен, но роль в WWW пока не назначена.', config: 'Supabase не настроен. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в переменные окружения проекта Vercel.', reset: 'Введите email и пароль для входа.', organizations: 'Организации', create: 'Создать организацию', orgName: 'Название организации', restaurant: 'Ресторан', supplier: 'Поставщик', winemaker: 'Винодел', creating: 'Создаём…', created: 'Организация создана.', empty: 'Организаций пока нет.' },
  ka: { title: 'Wines, Winemakers and Waiters', subtitle: 'ღვინის გაყიდვის უკეთესი გზა', login: 'სისტემაში შესვლა', email: 'Email', password: 'პაროლი', submit: 'შესვლა', signing: 'შესვლა…', logout: 'გასვლა', admin: 'WWW ადმინისტრატორი', welcome: 'თქვენ შესული ხართ და ადმინისტრატორის უფლებები დადასტურებულია.', checking: 'უფლებების შემოწმება…', noRole: 'ანგარიში აქტიურია, მაგრამ WWW როლი ჯერ არ არის მინიჭებული.', config: 'Supabase არ არის კონფიგურირებული. Vercel-ში დაამატეთ VITE_SUPABASE_URL და VITE_SUPABASE_ANON_KEY.', reset: 'გასაგრძელებლად შეიყვანეთ ელფოსტა და პაროლი.', organizations: 'ორგანიზაციები', create: 'ორგანიზაციის შექმნა', orgName: 'ორგანიზაციის სახელი', restaurant: 'რესტორანი', supplier: 'მომწოდებელი', winemaker: 'მეღვინე', creating: 'იქმნება…', created: 'ორგანიზაცია შეიქმნა.', empty: 'ორგანიზაციები ჯერ არ არის.' }
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
  const [orgContactFirstName, setOrgContactFirstName] = useState('');
  const [orgContactLastName, setOrgContactLastName] = useState('');
  const [orgContactPhone, setOrgContactPhone] = useState('');
  const [orgKind, setOrgKind] = useState<'restaurant' | 'supplier' | 'winemaker'>('restaurant');
  const [orgBusy, setOrgBusy] = useState(false);
  const [managerPhone, setManagerPhone] = useState('');
  const [managerFirstName, setManagerFirstName] = useState('');
  const [managerLastName, setManagerLastName] = useState('');
  const [managersByOrg, setManagersByOrg] = useState<Record<string, ManagerInfo[]>>({});
  const [addingManagerOrgId, setAddingManagerOrgId] = useState<string | null>(null);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editingOrgName, setEditingOrgName] = useState('');
  const [managerOrgId, setManagerOrgId] = useState('');
  const [managerBusy, setManagerBusy] = useState(false);
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
    supabase.from('organizations').select('id,name,kind,contact_first_name,contact_last_name,contact_phone,created_at,archived_at').is('archived_at', null).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setMessage(error.message);
        else setOrganizations((data ?? []) as Organization[]);
      });
    return () => { alive = false; };
  }, [session, isAdmin]);

  useEffect(() => {
    if (!supabase || !session || isAdmin !== true || organizations.length === 0) {
      setManagersByOrg({});
      return;
    }
    let alive = true;
    const restaurantIds = organizations.filter(org => org.kind === 'restaurant').map(org => org.id);
    if (restaurantIds.length === 0) { setManagersByOrg({}); return; }
    supabase.from('restaurant_manager_cards')
      .select('id,organization_id,first_name,last_name,phone')
      .in('organization_id', restaurantIds)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) { setMessage(error.message); return; }
        const next: Record<string, ManagerInfo[]> = {};
        (data ?? []).forEach((item: any) => {
          const { organization_id, ...manager } = item;
          next[organization_id] = [...(next[organization_id] ?? []), manager as ManagerInfo];
        });
        setManagersByOrg(next);
      });
    return () => { alive = false; };
  }, [session, isAdmin, organizations]);

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !orgName.trim()) return;
    setOrgBusy(true);
    setMessage('');
    const { data, error } = await supabase.from('organizations')
      .insert({ name: orgName.trim(), kind: orgKind, contact_first_name: orgContactFirstName.trim(), contact_last_name: orgContactLastName.trim(), contact_phone: orgContactPhone.trim().replace(/[\\s()-]/g, '') })
      .select('id,name,kind,contact_first_name,contact_last_name,contact_phone,created_at,archived_at')
      .single();
    if (error) setMessage(error.message);
    else if (data) {
      setOrganizations(current => [data as Organization, ...current]);
      setOrgName('');
      setOrgContactFirstName('');
      setOrgContactLastName('');
      setOrgContactPhone('');
      setMessage(lang === 'ru' ? 'Организация создана.' : lang === 'ka' ? 'ორგანიზაცია შეიქმნა.' : 'Organization created.');
    }
    setOrgBusy(false);
  }

  async function createManagerCard(event: FormEvent<HTMLFormElement>, organizationId: string) {
    event.preventDefault();
    if (!supabase || !managerPhone.trim() || !managerFirstName.trim() || !managerLastName.trim()) return;
    setManagerBusy(true);
    setMessage('');
    const normalizedPhone = managerPhone.trim().replace(/[\s()-]/g, '');
    const { data, error } = await supabase.from('restaurant_manager_cards')
      .insert({
        organization_id: organizationId,
        first_name: managerFirstName.trim(),
        last_name: managerLastName.trim(),
        phone: normalizedPhone
      })
      .select('id,first_name,last_name,phone')
      .single();
    if (error) setMessage(error.message);
    else if (data) {
      setManagersByOrg(current => ({
        ...current,
        [organizationId]: [...(current[organizationId] ?? []), data as ManagerInfo]
      }));
      setManagerPhone('');
      setManagerFirstName('');
      setManagerLastName('');
      setAddingManagerOrgId(null);
      setMessage('Карточка менеджера создана.');
    }
    setManagerBusy(false);
  }

  async function renameOrganization(orgId: string) {
    if (!supabase || !editingOrgName.trim()) return;
    const { data, error } = await supabase.from('organizations')
      .update({ name: editingOrgName.trim() })
      .eq('id', orgId)
      .select('id,name,kind,contact_first_name,contact_last_name,contact_phone,created_at,archived_at')
      .single();
    if (error) setMessage(error.message);
    else {
      setOrganizations(current => current.map(org => org.id === orgId ? data as Organization : org));
      setEditingOrgId(null);
      setEditingOrgName('');
      setMessage('Название организации обновлено.');
    }
  }

  async function archiveOrganization(org: Organization) {
    if (!supabase) return;
    const confirmed = window.confirm(`Убрать «${org.name}» из активных организаций? История продаж и выплат сохранится.`);
    if (!confirmed) return;
    const { error } = await supabase.from('organizations')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', org.id);
    if (error) setMessage(error.message);
    else {
      setOrganizations(current => current.filter(item => item.id !== org.id));
      setMessage('Организация удалена из активного списка. История сохранена.');
    }
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
                <label>Имя контактного лица<input required value={orgContactFirstName} onChange={e => setOrgContactFirstName(e.target.value)} placeholder="Имя" /></label>
                <label>Фамилия контактного лица<input required value={orgContactLastName} onChange={e => setOrgContactLastName(e.target.value)} placeholder="Фамилия" /></label>
                <label>Телефон организации<input type="tel" required value={orgContactPhone} onChange={e => setOrgContactPhone(e.target.value)} placeholder="+995 5XX XX XX XX" /></label>
                <label>Type<select value={orgKind} onChange={e => setOrgKind(e.target.value as 'restaurant' | 'supplier' | 'winemaker')}><option value="restaurant">{t.restaurant}</option><option value="supplier">{t.supplier}</option><option value="winemaker">{t.winemaker}</option></select></label>
                <button className="btn primary wide" type="submit" disabled={orgBusy || !orgName.trim() || !orgContactFirstName.trim() || !orgContactLastName.trim() || !orgContactPhone.trim()}>{orgBusy ? t.creating : t.create}</button>
              </form>
              <div className="org-list">{organizations.map(org => <div className="org-row org-row-managed" key={org.id}>
                <div className="org-main">
                  {editingOrgId === org.id ? <input className="org-rename-input" value={editingOrgName} onChange={e => setEditingOrgName(e.target.value)} /> : <b>{org.name}</b>}
                  <small>{org.kind === 'restaurant' ? t.restaurant : org.kind === 'supplier' ? t.supplier : t.winemaker}</small>
                  {(org.contact_first_name || org.contact_last_name) && <small>Контакт: {[org.contact_first_name, org.contact_last_name].filter(Boolean).join(' ')}</small>}
                  {org.contact_phone && <small>Телефон: {org.contact_phone}</small>}
                  {org.kind === 'restaurant' && <div className="manager-cards">
                    {(managersByOrg[org.id] ?? []).map(manager => <div className="manager-card" key={manager.id}>
                      <b>{[manager.first_name, manager.last_name].filter(Boolean).join(' ')}</b>
                      <small>{manager.phone || 'Телефон не указан'}</small>
                    </div>)}
                    {addingManagerOrgId === org.id && <form className="manager-inline-form" onSubmit={event => createManagerCard(event, org.id)}>
                      <label>Имя менеджера<input required value={managerFirstName} onChange={event => setManagerFirstName(event.target.value)} placeholder="Имя" /></label>
                      <label>Фамилия менеджера<input required value={managerLastName} onChange={event => setManagerLastName(event.target.value)} placeholder="Фамилия" /></label>
                      <label>Телефон менеджера<input type="tel" required value={managerPhone} onChange={event => setManagerPhone(event.target.value)} placeholder="+995 5XX XX XX XX" /></label>
                      <button className="btn primary" type="submit" disabled={managerBusy || !managerFirstName.trim() || !managerLastName.trim() || !managerPhone.trim()}>{managerBusy ? 'Сохраняем…' : 'Создать карточку'}</button>
                      <button className="btn quiet" type="button" onClick={() => { setAddingManagerOrgId(null); setManagerFirstName(''); setManagerLastName(''); setManagerPhone(''); }}>Отмена</button>
                    </form>}
                  </div>}
                </div>
                <div className="org-actions">
                  {editingOrgId === org.id ? <>
                    <button className="btn primary" type="button" onClick={() => renameOrganization(org.id)}>Сохранить</button>
                    <button className="btn quiet" type="button" onClick={() => setEditingOrgId(null)}>Отмена</button>
                  </> : <>
                    {org.kind === 'restaurant' && <button className="btn primary" type="button" onClick={() => { setAddingManagerOrgId(addingManagerOrgId === org.id ? null : org.id); setManagerFirstName(''); setManagerLastName(''); setManagerPhone(''); }}>+ Менеджер</button>}
                    <button className="btn quiet" type="button" onClick={() => { setEditingOrgId(org.id); setEditingOrgName(org.name); }}>Переименовать</button>
                    <button className="btn danger" type="button" onClick={() => archiveOrganization(org)}>Удалить</button>
                  </>}
                </div>
              </div>)}{organizations.length === 0 && <p>{t.empty}</p>}</div>

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
