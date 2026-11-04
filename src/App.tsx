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
  const [orgSearch, setOrgSearch] = useState('');
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
  const [editingContactFirstName, setEditingContactFirstName] = useState('');
  const [editingContactLastName, setEditingContactLastName] = useState('');
  const [editingContactPhone, setEditingContactPhone] = useState('');
  const [managerOrgId, setManagerOrgId] = useState('');
  const [managerBusy, setManagerBusy] = useState(false);
  const [publicView, setPublicView] = useState<'home' | 'signin' | 'register'>('home');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authFlowBusy, setAuthFlowBusy] = useState(false);
  const [registrationKind, setRegistrationKind] = useState<'restaurant' | 'winemaker' | 'supplier'>('restaurant');
  const [registrationCompany, setRegistrationCompany] = useState('');
  const [registrationFirstName, setRegistrationFirstName] = useState('');
  const [registrationLastName, setRegistrationLastName] = useState('');
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
      .insert({ name: orgName.trim(), kind: orgKind, contact_first_name: orgContactFirstName.trim(), contact_last_name: orgContactLastName.trim(), contact_phone: orgContactPhone.trim().replace(/[\s()-]/g, '') })
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

  async function saveOrganization(orgId: string) {
    if (!supabase || !editingOrgName.trim()) return;
    setOrgBusy(true);
    const { data, error } = await supabase.from('organizations')
      .update({
        name: editingOrgName.trim(),
        contact_first_name: editingContactFirstName.trim(),
        contact_last_name: editingContactLastName.trim(),
        contact_phone: editingContactPhone.trim().replace(/[\s()-]/g, '')
      })
      .eq('id', orgId)
      .select('id,name,kind,contact_first_name,contact_last_name,contact_phone,created_at,archived_at')
      .single();
    if (error) setMessage(error.message);
    else {
      setOrganizations(current => current.map(org => org.id === orgId ? data as Organization : org));
      setEditingOrgId(null);
      setEditingOrgName('');
      setEditingContactFirstName('');
      setEditingContactLastName('');
      setEditingContactPhone('');
      setMessage('Данные организации обновлены.');
    }
    setOrgBusy(false);
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

  function normalizePhone(value: string) {
    return value.trim().replace(/[\\s()-]/g, '');
  }

  async function requestPhoneCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const phone = normalizePhone(authPhone);
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setMessage('Введите номер в международном формате, например +995 555 12 34 56.');
      return;
    }
    setAuthFlowBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { data: { first_name: registrationFirstName.trim(), last_name: registrationLastName.trim(), display_name: [registrationFirstName.trim(), registrationLastName.trim()].filter(Boolean).join(' ') } }
    });
    if (error) setMessage(error.message);
    else {
      setAuthPhone(phone);
      setOtpSent(true);
      setMessage('SMS с кодом отправлено. Проверьте сообщения.');
    }
    setAuthFlowBusy(false);
  }

  async function verifyPhoneCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setAuthFlowBusy(true);
    setMessage('');
    const phone = normalizePhone(authPhone);
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: otpCode.trim(), type: 'sms' });
    if (error) {
      setMessage(error.message);
      setAuthFlowBusy(false);
      return;
    }
    if (publicView === 'register') {
      const { error: registrationError } = await supabase.rpc('register_organization', {
        p_name: registrationCompany.trim(),
        p_kind: registrationKind,
        p_first_name: registrationFirstName.trim(),
        p_last_name: registrationLastName.trim(),
        p_phone: phone
      });
      if (registrationError) {
        setMessage('Номер подтверждён, но не удалось завершить регистрацию: ' + registrationError.message);
        setAuthFlowBusy(false);
        return;
      }
      setMessage('Регистрация завершена. Организация и контактные данные сохранены.');
    } else {
      setMessage('Номер подтверждён. Вы вошли в WWW.');
    }
    setSession(data.session);
    setAuthFlowBusy(false);
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

  const organizationGroups = [
    { kind: 'restaurant' as const, title: 'Рестораны', color: 'restaurant', items: organizations.filter(org => org.kind === 'restaurant') },
    { kind: 'winemaker' as const, title: 'Винодельни', color: 'winemaker', items: organizations.filter(org => org.kind === 'winemaker') },
    { kind: 'supplier' as const, title: 'Поставщики', color: 'supplier', items: organizations.filter(org => org.kind === 'supplier') }
  ].map(group => ({
    ...group,
    items: group.items.filter(org => [org.name, org.contact_first_name, org.contact_last_name, org.contact_phone].some(value => (value ?? '').toLowerCase().includes(orgSearch.trim().toLowerCase())))
  }));

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
        !session ? <section className="auth-panel public-entry">
          {publicView === 'home' ? <>
            <div className="public-hero-mark">WWW</div>
            <h2>Wines, Winemakers and Waiters</h2>
            <p>Единая платформа для ресторанов, виноделен и дистрибьюторов.</p>
            <button className="btn primary wide" type="button" onClick={() => { setPublicView('signin'); setOtpSent(false); setMessage(''); }}>Sign in</button>
            <button className="btn quiet wide" type="button" onClick={() => { setPublicView('register'); setOtpSent(false); setMessage(''); }}>Registration</button>
            <button className="text-link" type="button" onClick={() => { setPublicView('signin'); setShowEmailLogin(true); setMessage(''); }}>Вход администратора по email</button>
          </> : publicView === 'signin' ? <>
            <button className="text-link back-link" type="button" onClick={() => { setPublicView('home'); setOtpSent(false); setShowEmailLogin(false); setMessage(''); }}>← На главную</button>
            <h2>Вход в WWW</h2>
            {!showEmailLogin ? <>
              {!otpSent ? <form onSubmit={requestPhoneCode}>
                <p>Введите номер телефона. Мы отправим SMS-код для входа.</p>
                <label>Контактный номер<input type="tel" required value={authPhone} onChange={e => setAuthPhone(e.target.value)} placeholder="+995 555 12 34 56" /></label>
                <button className="btn primary wide" type="submit" disabled={authFlowBusy}>{authFlowBusy ? 'Отправляем…' : 'Получить SMS-код'}</button>
              </form> : <form onSubmit={verifyPhoneCode}>
                <p>Код отправлен на {authPhone}.</p>
                <label>Код из SMS<input inputMode="numeric" autoComplete="one-time-code" required value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="123456" /></label>
                <button className="btn primary wide" type="submit" disabled={authFlowBusy || otpCode.trim().length < 4}>{authFlowBusy ? 'Проверяем…' : 'Подтвердить и войти'}</button>
                <button className="btn quiet wide" type="button" onClick={() => { setOtpSent(false); setOtpCode(''); }}>Изменить номер</button>
              </form>}
              <button className="text-link" type="button" onClick={() => { setShowEmailLogin(true); setMessage(''); }}>Вход по email и паролю</button>
            </> : <form onSubmit={signIn}>
              <p>Вход администратора.</p>
              <label>{t.email}<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
              <label>{t.password}<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></label>
              <button className="btn primary wide" type="submit" disabled={submitting}>{submitting ? t.signing : t.submit}</button>
              <button className="text-link" type="button" onClick={() => setShowEmailLogin(false)}>Войти по телефону</button>
            </form>}
          </> : <>
            <button className="text-link back-link" type="button" onClick={() => { setPublicView('home'); setOtpSent(false); setMessage(''); }}>← На главную</button>
            <h2>Регистрация организации</h2>
            {!otpSent ? <>
              <p>Выберите тип организации и заполните контактные данные.</p>
              <div className="registration-types">
                <button type="button" className={registrationKind === 'restaurant' ? 'registration-type selected' : 'registration-type'} onClick={() => setRegistrationKind('restaurant')}><b>Ресторан</b><small>Restaurant</small></button>
                <button type="button" className={registrationKind === 'winemaker' ? 'registration-type selected' : 'registration-type'} onClick={() => setRegistrationKind('winemaker')}><b>Винодельня</b><small>Winemaker</small></button>
                <button type="button" className={registrationKind === 'supplier' ? 'registration-type selected' : 'registration-type'} onClick={() => setRegistrationKind('supplier')}><b>Дистрибьютор</b><small>Distributor</small></button>
              </div>
              <form onSubmit={requestPhoneCode}>
                <label>Название компании<input required value={registrationCompany} onChange={e => setRegistrationCompany(e.target.value)} placeholder="Название организации" /></label>
                <label>Имя<input required value={registrationFirstName} onChange={e => setRegistrationFirstName(e.target.value)} placeholder="Имя" /></label>
                <label>Фамилия<input required value={registrationLastName} onChange={e => setRegistrationLastName(e.target.value)} placeholder="Фамилия" /></label>
                <label>Контактный номер<input type="tel" required value={authPhone} onChange={e => setAuthPhone(e.target.value)} placeholder="+995 555 12 34 56" /></label>
                <button className="btn primary wide" type="submit" disabled={authFlowBusy || !registrationCompany.trim() || !registrationFirstName.trim() || !registrationLastName.trim() || !authPhone.trim()}>{authFlowBusy ? 'Отправляем…' : 'Подтвердить номер по SMS'}</button>
              </form>
            </> : <form onSubmit={verifyPhoneCode}>
              <p>Мы отправили SMS с кодом на {authPhone}. После подтверждения создадим аккаунт организации.</p>
              <label>Код из SMS<input inputMode="numeric" autoComplete="one-time-code" required value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="123456" /></label>
              <button className="btn primary wide" type="submit" disabled={authFlowBusy || otpCode.trim().length < 4}>{authFlowBusy ? 'Проверяем…' : 'Подтвердить и зарегистрироваться'}</button>
              <button className="btn quiet wide" type="button" onClick={() => { setOtpSent(false); setOtpCode(''); }}>Изменить данные</button>
            </form>}
          </>}
        </section> :
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
              <div className="org-directory">
                <div className="org-directory-heading">
                  <div><b>База организаций</b><small>{organizations.length} активных аккаунтов</small></div>
                  <input className="org-search" value={orgSearch} onChange={event => setOrgSearch(event.target.value)} placeholder="Поиск по названию, контакту или телефону" />
                </div>
                {organizationGroups.map(group => <section className={`org-group ${group.color}`} key={group.kind}>
                  <div className="org-group-heading">
                    <span className="org-kind-dot" />
                    <h3>{group.title}</h3>
                    <span className="org-count">{group.items.length}</span>
                  </div>
                  <div className="org-list">
                    {group.items.map(org => <div className="org-row org-row-managed" key={org.id}>
                      <div className="org-main">
                        {editingOrgId === org.id ? <div className="org-edit-form">
                          <label>Название<input value={editingOrgName} onChange={e => setEditingOrgName(e.target.value)} required /></label>
                          <label>Имя контактного лица<input value={editingContactFirstName} onChange={e => setEditingContactFirstName(e.target.value)} /></label>
                          <label>Фамилия контактного лица<input value={editingContactLastName} onChange={e => setEditingContactLastName(e.target.value)} /></label>
                          <label>Телефон<input type="tel" value={editingContactPhone} onChange={e => setEditingContactPhone(e.target.value)} placeholder="+995 5XX XX XX XX" /></label>
                        </div> : <><b>{org.name}</b>
                          <small>{[org.contact_first_name, org.contact_last_name].filter(Boolean).join(' ') || 'Контакт не указан'}</small>
                          <small>{org.contact_phone || 'Телефон не указан'}</small></>}
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
                          <button className="btn primary" type="button" disabled={orgBusy || !editingOrgName.trim()} onClick={() => saveOrganization(org.id)}>{orgBusy ? 'Сохраняем…' : 'Сохранить'}</button>
                          <button className="btn quiet" type="button" onClick={() => { setEditingOrgId(null); setEditingOrgName(''); setEditingContactFirstName(''); setEditingContactLastName(''); setEditingContactPhone(''); }}>Отмена</button>
                        </> : <>
                          {org.kind === 'restaurant' && <button className="btn primary" type="button" onClick={() => { setAddingManagerOrgId(addingManagerOrgId === org.id ? null : org.id); setManagerFirstName(''); setManagerLastName(''); setManagerPhone(''); }}>+ Менеджер</button>}
                          <button className="btn quiet" type="button" onClick={() => { setEditingOrgId(org.id); setEditingOrgName(org.name); setEditingContactFirstName(org.contact_first_name ?? ''); setEditingContactLastName(org.contact_last_name ?? ''); setEditingContactPhone(org.contact_phone ?? ''); }}>Редактировать</button>
                          <button className="btn danger" type="button" onClick={() => archiveOrganization(org)}>Убрать</button>
                        </>}
                      </div>
                    </div>)}
                    {group.items.length === 0 && <p className="org-empty">{orgSearch ? 'Ничего не найдено в этой категории.' : 'Пока нет организаций в этой категории.'}</p>}
                  </div>
                </section>)}
                {organizations.length === 0 && <p>{t.empty}</p>}
              </div>

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
