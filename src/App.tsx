import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './lib/supabase';

type Lang = 'en' | 'ru' | 'ka';
type Organization = { id: string; name: string; kind: 'restaurant' | 'supplier' | 'winemaker'; contact_first_name?: string | null; contact_last_name?: string | null; contact_phone?: string | null; created_at: string; archived_at?: string | null };
type ManagerInfo = { id: string; first_name: string; last_name: string; phone: string | null };
type CabinetMembership = { id: string; organization_id: string; role: 'waiter' | 'manager' | 'supplier'; organization: { id: string; name: string; kind: 'restaurant' | 'supplier' | 'winemaker' } };
const copy = {
 en:{saveError:'Could not save the record.',title:'Wines, Winemakers and Waiters',subtitle:'A smarter way to sell wine',email:'Email',password:'Password',submit:'Sign in',signing:'Signing in…',logout:'Sign out',admin:'WWW administrator',welcome:'You are signed in. Administrator access confirmed.',checking:'Checking your access…',config:'Supabase is not configured. Add the required environment variables in Vercel.',organizations:'Organizations',create:'Create organization',orgName:'Organization name',restaurant:'Restaurant',supplier:'Distributor',winemaker:'Winery',creating:'Creating…',created:'Organization created.',empty:'No organizations yet.',home:'A shared platform for restaurants, wineries and distributors.',signIn:'Sign in',registration:'Create an account',adminLogin:'Administrator sign-in',backHome:'← Home',signInTitle:'Sign in to WWW',signInHint:'Sign in with your email and password.',registerTitle:'Organization registration',registerHint:'Create an account with your email and password, then enter your organization details.',register:'Create account',registering:'Creating account…',company:'Company name',firstName:'First name',lastName:'Last name',phone:'Phone',optionalPhone:'Phone (optional)',orgPhone:'Organization phone',contactFirst:'Contact first name',contactLast:'Contact last name',type:'Type',directory:'Organization directory',active:'active organizations',search:'Search by name, contact or phone',noContact:'No contact provided',noPhone:'No phone provided',managerFirst:'Manager first name',managerLast:'Manager last name',managerPhone:'Manager phone',save:'Save',saving:'Saving…',cancel:'Cancel',createCard:'Create manager card',addManager:'+ Manager',edit:'Edit',archive:'Archive',noResults:'No matches in this category.',noCategory:'There are no organizations in this category yet.',finish:'Complete registration',accountConfirmed:'Your account is confirmed. Enter your organization details to create your WWW workspace.',createOrg:'Create organization',registrationDone:'Registration complete. Your organization is linked to your account.',emailConfirmed:'Email confirmed. Enter your organization details.',emailSent:'A confirmation email has been sent to',emailContinue:'Open the link in the email to continue registration.',managerCreated:'Manager card created.',orgUpdated:'Organization details updated.',orgArchived:'Organization removed from the active list. History has been preserved.',archiveConfirm:'Remove “{name}” from active organizations? Sales and payout history will be preserved.',invalidPhone:'Enter a phone number in international format, for example +995 555 12 34 56.',smsSent:'An SMS code has been sent. Check your messages.',phoneVerified:'Phone verified. You are signed in to WWW.',phoneRegError:'Phone verified, but registration could not be completed: ',phoneRegDone:'Registration complete. Organization and contact details have been saved.',regError:'Registration could not be completed: ',wineSales:'WINE SALES INCENTIVES',early:'EARLY ACCESS',language:'Language',namePlaceholder:'Organization name',firstPlaceholder:'First name',lastPlaceholder:'Last name',phonePlaceholder:'+995 5XX XX XX XX',passwordHint:'At least 8 characters',emailPlaceholder:'you@example.com',remove:'Remove',testCabinets:'Test cabinets',testCabinetHint:'Create test organizations linked to this same account, then switch between their workspaces.',switchCabinet:'Switch workspace',testOrgPlaceholder:'For example: Test Restaurant',createTestCabinet:'Create test workspace',testCabinetCreated:'Test workspace created and linked to your account.',testCabinetIntro:'This test workspace is linked to your current login. The full role-specific tools will be added in the next development stage.',managerRole:'Restaurant manager',supplierRole:'Supplier account'},
 ru:{saveError:'Не удалось сохранить запись.',title:'Wines, Winemakers and Waiters',subtitle:'Умнее продаём вино',email:'Электронная почта',password:'Пароль',submit:'Войти',signing:'Входим…',logout:'Выйти',admin:'Администратор WWW',welcome:'Вы вошли в систему. Права администратора подтверждены.',checking:'Проверяем ваши права…',config:'Supabase не настроен. Добавьте необходимые переменные окружения в проекте Vercel.',organizations:'Организации',create:'Создать организацию',orgName:'Название организации',restaurant:'Ресторан',supplier:'Дистрибьютор',winemaker:'Винодельня',creating:'Создаём…',created:'Организация создана.',empty:'Организаций пока нет.',home:'Единая платформа для ресторанов, виноделен и дистрибьюторов.',signIn:'Войти',registration:'Зарегистрироваться',adminLogin:'Вход администратора',backHome:'← На главную',signInTitle:'Вход в WWW',signInHint:'Войдите с помощью электронной почты и пароля.',registerTitle:'Регистрация организации',registerHint:'Создайте аккаунт с помощью электронной почты и пароля, затем заполните данные организации.',register:'Создать аккаунт',registering:'Создаём аккаунт…',company:'Название компании',firstName:'Имя',lastName:'Фамилия',phone:'Телефон',optionalPhone:'Телефон (необязательно)',orgPhone:'Телефон организации',contactFirst:'Имя контактного лица',contactLast:'Фамилия контактного лица',type:'Тип организации',directory:'База организаций',active:'активных организаций',search:'Поиск по названию, контакту или телефону',noContact:'Контакт не указан',noPhone:'Телефон не указан',managerFirst:'Имя менеджера',managerLast:'Фамилия менеджера',managerPhone:'Телефон менеджера',save:'Сохранить',saving:'Сохраняем…',cancel:'Отмена',createCard:'Создать карточку менеджера',addManager:'+ Менеджер',edit:'Редактировать',archive:'Убрать',noResults:'Ничего не найдено в этой категории.',noCategory:'Пока нет организаций в этой категории.',finish:'Завершение регистрации',accountConfirmed:'Аккаунт подтверждён. Укажите данные организации, чтобы создать рабочий профиль WWW.',createOrg:'Создать организацию',registrationDone:'Регистрация завершена. Организация привязана к вашему аккаунту.',emailConfirmed:'Email подтверждён. Заполните данные организации.',emailSent:'Письмо для подтверждения отправлено на',emailContinue:'Перейдите по ссылке из письма, чтобы продолжить регистрацию.',managerCreated:'Карточка менеджера создана.',orgUpdated:'Данные организации обновлены.',orgArchived:'Организация убрана из активного списка. История сохранена.',archiveConfirm:'Убрать «{name}» из активных организаций? История продаж и выплат сохранится.',invalidPhone:'Введите номер в международном формате, например +995 555 12 34 56.',smsSent:'SMS с кодом отправлено. Проверьте сообщения.',phoneVerified:'Номер подтверждён. Вы вошли в WWW.',phoneRegError:'Номер подтверждён, но не удалось завершить регистрацию: ',phoneRegDone:'Регистрация завершена. Организация и контактные данные сохранены.',regError:'Не удалось завершить регистрацию: ',wineSales:'СТИМУЛИРОВАНИЕ ПРОДАЖ ВИНА',early:'РАННИЙ ДОСТУП',language:'Язык',namePlaceholder:'Название организации',firstPlaceholder:'Имя',lastPlaceholder:'Фамилия',phonePlaceholder:'+995 5XX XX XX XX',passwordHint:'Минимум 8 символов',emailPlaceholder:'you@example.com',remove:'Убрать',testCabinets:'Тестовые кабинеты',testCabinetHint:'Создавай тестовые организации, привязанные к этому же аккаунту, и переключайся между ними.',switchCabinet:'Переключить кабинет',testOrgPlaceholder:'Например: Тестовый ресторан',createTestCabinet:'Создать тестовый кабинет',testCabinetCreated:'Тестовый кабинет создан и привязан к аккаунту.',testCabinetIntro:'Этот тестовый кабинет привязан к текущему логину. Полноценные инструменты каждой роли добавим на следующем этапе.',managerRole:'Менеджер ресторана',supplierRole:'Аккаунт поставщика'},
 ka:{saveError:'მონაცემის შენახვა ვერ მოხერხდა.',title:'Wines, Winemakers and Waiters',subtitle:'ღვინის გაყიდვის უკეთესი გზა',email:'ელფოსტა',password:'პაროლი',submit:'შესვლა',signing:'შესვლა…',logout:'გასვლა',admin:'WWW-ის ადმინისტრატორი',welcome:'სისტემაში შესული ხართ. ადმინისტრატორის უფლებები დადასტურებულია.',checking:'წვდომის შემოწმება…',config:'Supabase არ არის კონფიგურირებული. საჭირო გარემოს ცვლადები დაამატეთ Vercel-ის პროექტში.',organizations:'ორგანიზაციები',create:'ორგანიზაციის შექმნა',orgName:'ორგანიზაციის დასახელება',restaurant:'რესტორანი',supplier:'დისტრიბუტორი',winemaker:'მეღვინეობა',creating:'იქმნება…',created:'ორგანიზაცია შეიქმნა.',empty:'ორგანიზაციები ჯერ არ არის.',home:'ერთიანი პლატფორმა რესტორნებისთვის, მეღვინეობებისა და დისტრიბუტორებისთვის.',signIn:'შესვლა',registration:'რეგისტრაცია',adminLogin:'ადმინისტრატორის შესვლა',backHome:'← მთავარზე დაბრუნება',signInTitle:'WWW-ში შესვლა',signInHint:'შედით ელფოსტითა და პაროლით.',registerTitle:'ორგანიზაციის რეგისტრაცია',registerHint:'შექმენით ანგარიში ელფოსტითა და პაროლით, შემდეგ შეავსეთ ორგანიზაციის მონაცემები.',register:'ანგარიშის შექმნა',registering:'ანგარიში იქმნება…',company:'კომპანიის დასახელება',firstName:'სახელი',lastName:'გვარი',phone:'ტელეფონი',optionalPhone:'ტელეფონი (არასავალდებულო)',orgPhone:'ორგანიზაციის ტელეფონი',contactFirst:'საკონტაქტო პირის სახელი',contactLast:'საკონტაქტო პირის გვარი',type:'ტიპი',directory:'ორგანიზაციების სია',active:'აქტიური ორგანიზაცია',search:'ძიება სახელით, საკონტაქტო პირით ან ტელეფონით',noContact:'საკონტაქტო პირი მითითებული არ არის',noPhone:'ტელეფონი მითითებული არ არის',managerFirst:'მენეჯერის სახელი',managerLast:'მენეჯერის გვარი',managerPhone:'მენეჯერის ტელეფონი',save:'შენახვა',saving:'ინახება…',cancel:'გაუქმება',createCard:'მენეჯერის ბარათის შექმნა',addManager:'+ მენეჯერი',edit:'რედაქტირება',archive:'არქივში გადატანა',noResults:'ამ კატეგორიაში შედეგები ვერ მოიძებნა.',noCategory:'ამ კატეგორიაში ორგანიზაციები ჯერ არ არის.',finish:'რეგისტრაციის დასრულება',accountConfirmed:'ანგარიში დადასტურებულია. WWW-ის სამუშაო პროფილის შესაქმნელად შეიყვანეთ ორგანიზაციის მონაცემები.',createOrg:'ორგანიზაციის შექმნა',registrationDone:'რეგისტრაცია დასრულებულია. ორგანიზაცია თქვენს ანგარიშს მიება.',emailConfirmed:'ელფოსტა დადასტურებულია. შეავსეთ ორგანიზაციის მონაცემები.',emailSent:'დადასტურების წერილი გაიგზავნა მისამართზე',emailContinue:'რეგისტრაციის გასაგრძელებლად გახსენით წერილში მოცემული ბმული.',managerCreated:'მენეჯერის ბარათი შეიქმნა.',orgUpdated:'ორგანიზაციის მონაცემები განახლდა.',orgArchived:'ორგანიზაცია აქტიური სიიდან ამოღებულია. ისტორია შენარჩუნებულია.',archiveConfirm:'გსურთ „{name}“-ის აქტიური ორგანიზაციების სიიდან ამოღება? გაყიდვებისა და გადახდების ისტორია შენარჩუნდება.',invalidPhone:'შეიყვანეთ ტელეფონის ნომერი საერთაშორისო ფორმატით, მაგალითად +995 555 12 34 56.',smsSent:'SMS კოდი გაიგზავნა. შეამოწმეთ შეტყობინებები.',phoneVerified:'ნომერი დადასტურებულია. WWW-ში შესული ხართ.',phoneRegError:'ნომერი დადასტურდა, მაგრამ რეგისტრაციის დასრულება ვერ მოხერხდა: ',phoneRegDone:'რეგისტრაცია დასრულებულია. ორგანიზაციისა და საკონტაქტო მონაცემები შენახულია.',regError:'რეგისტრაციის დასრულება ვერ მოხერხდა: ',wineSales:'ღვინის გაყიდვების სტიმულირება',early:'ადრეული წვდომა',language:'ენა',namePlaceholder:'ორგანიზაციის დასახელება',firstPlaceholder:'სახელი',lastPlaceholder:'გვარი',phonePlaceholder:'+995 5XX XX XX XX',passwordHint:'მინიმუმ 8 სიმბოლო',emailPlaceholder:'you@example.com',remove:'ამოღება',testCabinets:'სატესტო კაბინეტები',testCabinetHint:'შექმენით სატესტო ორგანიზაციები იმავე ანგარიშზე და გადაერთეთ მათ სამუშაო სივრცეებს შორის.',switchCabinet:'სამუშაო სივრცის შეცვლა',testOrgPlaceholder:'მაგალითად: სატესტო რესტორანი',createTestCabinet:'სატესტო კაბინეტის შექმნა',testCabinetCreated:'სატესტო სამუშაო სივრცე შეიქმნა და ანგარიშს მიება.',testCabinetIntro:'ეს სატესტო სივრცე თქვენს ამჟამინდელ ანგარიშთან არის დაკავშირებული. თითოეული როლის სრულ ფუნქციებს განვითარების შემდეგ ეტაპზე დავამატებთ.',managerRole:'რესტორნის მენეჯერი',supplierRole:'მომწოდებლის ანგარიში'}
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
  const [cabinetMemberships, setCabinetMemberships] = useState<CabinetMembership[]>([]);
  const [selectedCabinet, setSelectedCabinet] = useState('admin');
  const [testCabinetKind, setTestCabinetKind] = useState<'restaurant' | 'winemaker' | 'supplier'>('restaurant');
  const [testCabinetName, setTestCabinetName] = useState('');
  const [testCabinetBusy, setTestCabinetBusy] = useState(false);
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
    if (!supabase || !session || isAdmin !== true) { setCabinetMemberships([]); return; }
    let alive = true;
    supabase.from('memberships')
      .select('id,organization_id,role,organization:organizations(id,name,kind)')
      .eq('user_id', session.user.id)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) { setMessage(error.message); return; }
        setCabinetMemberships((data ?? []) as unknown as CabinetMembership[]);
      });
    return () => { alive = false; };
  }, [session, isAdmin]);

  async function createTestCabinet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !session || !testCabinetName.trim()) return;
    setTestCabinetBusy(true);
    setMessage('');
    const { data: org, error: orgError } = await supabase.from('organizations')
      .insert({ name: testCabinetName.trim(), kind: testCabinetKind })
      .select('id,name,kind')
      .single();
    if (orgError || !org) {
      setMessage(orgError?.message ?? t.saveError);
      setTestCabinetBusy(false);
      return;
    }
    const role = testCabinetKind === 'restaurant' ? 'manager' : 'supplier';
    const { data: membership, error: membershipError } = await supabase.from('memberships')
      .insert({ organization_id: org.id, user_id: session.user.id, role })
      .select('id,organization_id,role')
      .single();
    if (membershipError || !membership) {
      setMessage(membershipError?.message ?? t.saveError);
      setTestCabinetBusy(false);
      return;
    }
    setCabinetMemberships(current => [...current, { ...membership, organization: org } as CabinetMembership]);
    setTestCabinetName('');
    setSelectedCabinet(membership.id);
    setMessage(t.testCabinetCreated);
    setTestCabinetBusy(false);
  }

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
      setMessage(t.created);
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
      setMessage(t.managerCreated);
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
      setMessage(t.orgUpdated);
    }
    setOrgBusy(false);
  }

  async function archiveOrganization(org: Organization) {
    if (!supabase) return;
    const confirmed = window.confirm(t.archiveConfirm.replace('{name}', org.name));
    if (!confirmed) return;
    const { error } = await supabase.from('organizations')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', org.id);
    if (error) setMessage(error.message);
    else {
      setOrganizations(current => current.filter(item => item.id !== org.id));
      setMessage(t.orgArchived);
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
      setMessage(t.invalidPhone);
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
      setMessage(t.smsSent);
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
        setMessage(t.phoneRegError + registrationError.message);
        setAuthFlowBusy(false);
        return;
      }
      setMessage(t.phoneRegDone);
    } else {
      setMessage(t.phoneVerified);
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

  async function registerWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setAuthFlowBusy(true);
    setMessage('');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) setMessage(error.message);
    else if (data.session) {
      setSession(data.session);
      setMessage(t.emailConfirmed);
    } else {
      setMessage(t.emailSent + ' ' + email.trim() + '. ' + t.emailContinue);
    }
    setAuthFlowBusy(false);
  }

  async function completeOrganizationRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !session) return;
    setAuthFlowBusy(true);
    setMessage('');
    const { error } = await supabase.rpc('register_organization_email', {
      p_name: registrationCompany.trim(),
      p_kind: registrationKind,
      p_first_name: registrationFirstName.trim(),
      p_last_name: registrationLastName.trim(),
      p_phone: authPhone.trim() || null
    });
    if (error) setMessage(t.regError + error.message);
    else setMessage(t.registrationDone);
    setAuthFlowBusy(false);
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
      <button className="brand brand-home" type="button" aria-label={t.backHome} onClick={() => { setPublicView("home"); setShowEmailLogin(false); setOtpSent(false); setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}><div className="mark">🍷</div><div><b>WWW</b><small>WINES · WINEMAKERS · WAITERS</small></div></button>
      <select aria-label={t.language} value={lang} onChange={e => setLang(e.target.value as Lang)}><option value="en">EN</option><option value="ru">RU</option><option value="ka">KA</option></select>
    </header>
    <main>
      <div className="eyebrow">{t.wineSales}</div>
      <h1>{t.title}</h1>
      <p className="sub">{t.subtitle}</p>
      {!isSupabaseConfigured ? <div className="auth-message error">{t.config}</div> :
        busy ? <div className="auth-panel">{t.checking}</div> :
        !session ? <section className="auth-panel public-entry">
          {publicView === 'home' ? <>
            <div className="public-hero-mark">WWW</div>
            <p>{t.home}</p>
            <button className="btn primary wide" type="button" onClick={() => { setPublicView('signin'); setOtpSent(false); setMessage(''); }}>{t.signIn}</button>
            <button className="btn quiet wide" type="button" onClick={() => { setPublicView('register'); setOtpSent(false); setMessage(''); }}>{t.registration}</button>
            <button className="text-link" type="button" onClick={() => { setPublicView('signin'); setShowEmailLogin(true); setMessage(''); }}>{t.adminLogin}</button>
          </> : publicView === 'signin' ? <>
            <button className="text-link back-link" type="button" onClick={() => { setPublicView('home'); setOtpSent(false); setShowEmailLogin(false); setMessage(''); }}>{t.backHome}</button>
            <h2>{t.signInTitle}</h2>
            <form onSubmit={signIn}>
              <p>{t.signInHint}</p>
              <label>{t.email}<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailPlaceholder} /></label>
              <label>{t.password}<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></label>
              <button className="btn primary wide" type="submit" disabled={submitting}>{submitting ? t.signing : t.submit}</button>
            </form>
          </> : <>
            <button className="text-link back-link" type="button" onClick={() => { setPublicView('home'); setMessage(''); }}>{t.backHome}</button>
            <h2>{t.registerTitle}</h2>
            <p>{t.registerHint}</p>
            <form onSubmit={registerWithEmail}>
              <label>{t.email}<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailPlaceholder} /></label>
              <label>{t.password}<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder={t.passwordHint} /></label>
              <button className="btn primary wide" type="submit" disabled={authFlowBusy || !email.trim() || password.length < 8}>{authFlowBusy ? t.registering : t.register}</button>
            </form>
          </>}
        </section> :
        <section className="auth-panel">
          <div className="auth-status"><span className="status-dot" />{session.user.email}</div>
          {isAdmin === null ? <p>{t.checking}</p> : isAdmin && selectedCabinet !== 'admin' ? (() => {
            const active = cabinetMemberships.find(item => item.id === selectedCabinet);
            if (!active) return <p>{t.checking}</p>;
            const cabinetTitle = active.organization.kind === 'restaurant' ? t.restaurant : active.organization.kind === 'winemaker' ? t.winemaker : t.supplier;
            return <div className="admin-section">
              <button className="text-link back-link" type="button" onClick={() => setSelectedCabinet('admin')}>← {t.admin}</button>
              <div className="admin-mark">WWW</div><h2>{cabinetTitle}</h2>
              <p><b>{active.organization.name}</b></p>
              <p>{t.testCabinetIntro}</p>
              <div className="auth-status">{active.role === 'manager' ? t.managerRole : t.supplierRole}</div>
            </div>;
          })() : isAdmin ? <>
            <div className="admin-mark">WWW</div><h2>{t.admin}</h2><p>{t.welcome}</p>
            <div className="admin-section">
              <h2>{t.testCabinets}</h2>
              <p>{t.testCabinetHint}</p>
              <label>{t.switchCabinet}<select value={selectedCabinet} onChange={e => setSelectedCabinet(e.target.value)}>
                <option value="admin">{t.admin}</option>
                {cabinetMemberships.map(item => <option key={item.id} value={item.id}>{item.organization.name} — {item.organization.kind === 'restaurant' ? t.restaurant : item.organization.kind === 'winemaker' ? t.winemaker : t.supplier}</option>)}
              </select></label>
              <form onSubmit={createTestCabinet}>
                <label>{t.type}<select value={testCabinetKind} onChange={e => setTestCabinetKind(e.target.value as 'restaurant' | 'winemaker' | 'supplier')}><option value="restaurant">{t.restaurant}</option><option value="winemaker">{t.winemaker}</option><option value="supplier">{t.supplier}</option></select></label>
                <label>{t.orgName}<input required value={testCabinetName} onChange={e => setTestCabinetName(e.target.value)} placeholder={t.testOrgPlaceholder} /></label>
                <button className="btn primary wide" type="submit" disabled={testCabinetBusy || !testCabinetName.trim()}>{testCabinetBusy ? t.creating : t.createTestCabinet}</button>
              </form>
            </div>
            <div className="admin-section">
              <h2>{t.organizations}</h2>
              <form onSubmit={createOrganization}>
                <label>{t.orgName}<input required value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Wine House Tbilisi" /></label>
                <label>{t.contactFirst}<input required value={orgContactFirstName} onChange={e => setOrgContactFirstName(e.target.value)} placeholder={t.firstPlaceholder} /></label>
                <label>{t.contactLast}<input required value={orgContactLastName} onChange={e => setOrgContactLastName(e.target.value)} placeholder={t.lastPlaceholder} /></label>
                <label>{t.orgPhone}<input type="tel" required value={orgContactPhone} onChange={e => setOrgContactPhone(e.target.value)} placeholder={t.phonePlaceholder} /></label>
                <label>{t.type}<select value={orgKind} onChange={e => setOrgKind(e.target.value as 'restaurant' | 'supplier' | 'winemaker')}><option value="restaurant">{t.restaurant}</option><option value="supplier">{t.supplier}</option><option value="winemaker">{t.winemaker}</option></select></label>
                <button className="btn primary wide" type="submit" disabled={orgBusy || !orgName.trim() || !orgContactFirstName.trim() || !orgContactLastName.trim() || !orgContactPhone.trim()}>{orgBusy ? t.creating : t.create}</button>
              </form>
              <div className="org-directory">
                <div className="org-directory-heading">
                  <div><b>{t.directory}</b><small>{organizations.length} {t.active}</small></div>
                  <input className="org-search" value={orgSearch} onChange={event => setOrgSearch(event.target.value)} placeholder={t.search} />
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
                          <label>{t.orgName}<input value={editingOrgName} onChange={e => setEditingOrgName(e.target.value)} required /></label>
                          <label>{t.contactFirst}<input value={editingContactFirstName} onChange={e => setEditingContactFirstName(e.target.value)} /></label>
                          <label>{t.contactLast}<input value={editingContactLastName} onChange={e => setEditingContactLastName(e.target.value)} /></label>
                          <label>{t.phone}<input type="tel" value={editingContactPhone} onChange={e => setEditingContactPhone(e.target.value)} placeholder={t.phonePlaceholder} /></label>
                        </div> : <><b>{org.name}</b>
                          <small>{[org.contact_first_name, org.contact_last_name].filter(Boolean).join(' ') || t.noContact}</small>
                          <small>{org.contact_phone || t.noPhone}</small></>}
                        {org.kind === 'restaurant' && <div className="manager-cards">
                          {(managersByOrg[org.id] ?? []).map(manager => <div className="manager-card" key={manager.id}>
                            <b>{[manager.first_name, manager.last_name].filter(Boolean).join(' ')}</b>
                            <small>{manager.phone || t.noPhone}</small>
                          </div>)}
                          {addingManagerOrgId === org.id && <form className="manager-inline-form" onSubmit={event => createManagerCard(event, org.id)}>
                            <label>{t.managerFirst}<input required value={managerFirstName} onChange={event => setManagerFirstName(event.target.value)} placeholder={t.firstPlaceholder} /></label>
                            <label>{t.managerLast}<input required value={managerLastName} onChange={event => setManagerLastName(event.target.value)} placeholder={t.lastPlaceholder} /></label>
                            <label>{t.managerPhone}<input type="tel" required value={managerPhone} onChange={event => setManagerPhone(event.target.value)} placeholder={t.phonePlaceholder} /></label>
                            <button className="btn primary" type="submit" disabled={managerBusy || !managerFirstName.trim() || !managerLastName.trim() || !managerPhone.trim()}>{managerBusy ? t.saving : t.createCard}</button>
                            <button className="btn quiet" type="button" onClick={() => { setAddingManagerOrgId(null); setManagerFirstName(''); setManagerLastName(''); setManagerPhone(''); }}>{t.cancel}</button>
                          </form>}
                        </div>}
                      </div>
                      <div className="org-actions">
                        {editingOrgId === org.id ? <>
                          <button className="btn primary" type="button" disabled={orgBusy || !editingOrgName.trim()} onClick={() => saveOrganization(org.id)}>{orgBusy ? t.saving : t.save}</button>
                          <button className="btn quiet" type="button" onClick={() => { setEditingOrgId(null); setEditingOrgName(''); setEditingContactFirstName(''); setEditingContactLastName(''); setEditingContactPhone(''); }}>{t.cancel}</button>
                        </> : <>
                          {org.kind === 'restaurant' && <button className="btn primary" type="button" onClick={() => { setAddingManagerOrgId(addingManagerOrgId === org.id ? null : org.id); setManagerFirstName(''); setManagerLastName(''); setManagerPhone(''); }}>+ Менеджер</button>}
                          <button className="btn quiet" type="button" onClick={() => { setEditingOrgId(org.id); setEditingOrgName(org.name); setEditingContactFirstName(org.contact_first_name ?? ''); setEditingContactLastName(org.contact_last_name ?? ''); setEditingContactPhone(org.contact_phone ?? ''); }}>{t.edit}</button>
                          <button className="btn danger" type="button" onClick={() => archiveOrganization(org)}>{t.archive}</button>
                        </>}
                      </div>
                    </div>)}
                    {group.items.length === 0 && <p className="org-empty">{orgSearch ? t.noResults : t.noCategory}</p>}
                  </div>
                </section>)}
                {organizations.length === 0 && <p>{t.empty}</p>}
              </div>

            </div>
          </> : <><h2>{t.finish}</h2><p>{t.accountConfirmed}</p>
            <form onSubmit={completeOrganizationRegistration}>
              <div className="registration-types">
                <button type="button" className={registrationKind === 'restaurant' ? 'registration-type selected' : 'registration-type'} onClick={() => setRegistrationKind('restaurant')}><b>{t.restaurant}</b></button>
                <button type="button" className={registrationKind === 'winemaker' ? 'registration-type selected' : 'registration-type'} onClick={() => setRegistrationKind('winemaker')}><b>{t.winemaker}</b></button>
                <button type="button" className={registrationKind === 'supplier' ? 'registration-type selected' : 'registration-type'} onClick={() => setRegistrationKind('supplier')}><b>{t.supplier}</b></button>
              </div>
              <label>{t.company}<input required value={registrationCompany} onChange={e => setRegistrationCompany(e.target.value)} placeholder={t.namePlaceholder} /></label>
              <label>{t.firstName}<input required value={registrationFirstName} onChange={e => setRegistrationFirstName(e.target.value)} placeholder={t.firstPlaceholder} /></label>
              <label>{t.lastName}<input required value={registrationLastName} onChange={e => setRegistrationLastName(e.target.value)} placeholder={t.lastPlaceholder} /></label>
              <label>{t.optionalPhone}<input type="tel" value={authPhone} onChange={e => setAuthPhone(e.target.value)} placeholder={t.phonePlaceholder} /></label>
              <button className="btn primary wide" type="submit" disabled={authFlowBusy || !registrationCompany.trim() || !registrationFirstName.trim() || !registrationLastName.trim()}>{authFlowBusy ? t.saving : t.createOrg}</button>
            </form>
          </>}
          <button className="btn quiet wide" onClick={signOut}>{t.logout}</button>
        </section>
      }
      {message && <div className="auth-message error">{message}</div>}
    </main>
    <footer>WWW · {t.wineSales} <span>{t.early}</span></footer>
  </div>;
}
