import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, BookOpen, CalendarDays, Check, ChevronLeft,
  ChevronRight, ClipboardList, CreditCard, GraduationCap, LayoutDashboard, LogOut, Menu, Moon, Plus,
  Search, Settings, Shield, Sun, Users, Wallet, X, Pencil, Trash2, LoaderCircle, Languages,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { request } from "./services/api.js";

const modules = [
  { key: "dashboard", label: "Dashboard", km: "ផ្ទាំងគ្រប់គ្រង", icon: LayoutDashboard },
  { key: "students", label: "Students", km: "សិស្ស", icon: GraduationCap },
  { key: "teachers", label: "Teachers", km: "គ្រូបង្រៀន", icon: Users },
  { key: "classes", label: "Classes", km: "ថ្នាក់រៀន", icon: ClipboardList },
  { key: "subjects", label: "Subjects", km: "មុខវិជ្ជា", icon: BookOpen },
  { key: "attendance", label: "Attendance", km: "វត្តមាន", icon: Check },
  { key: "examinations", label: "Examinations", km: "ការប្រឡង", icon: ClipboardList },
  { key: "grades", label: "Grades", km: "ពិន្ទុ", icon: Activity },
  { key: "timetable", label: "Timetable", km: "កាលវិភាគ", icon: CalendarDays },
  { key: "parents", label: "Parents", km: "មាតាបិតា", icon: Users },
  { key: "fees", label: "Fees", km: "ថ្លៃសិក្សា", icon: Wallet },
  { key: "payments", label: "Payments", km: "ការទូទាត់", icon: CreditCard },
  { key: "books", label: "Library", km: "បណ្ណាល័យ", icon: BookOpen },
  { key: "announcements", label: "Announcements", km: "សេចក្តីជូនដំណឹង", icon: Bell },
  { key: "reports", label: "Reports", km: "របាយការណ៍", icon: Activity },
  { key: "settings", label: "Settings", km: "ការកំណត់", icon: Settings },
];

const moduleFields = {
  students: [["studentId", "Student ID", "text", true], ["firstName", "First name", "text", true], ["lastName", "Last name", "text", true], ["khmerName", "Khmer name"], ["gender", "Gender", "select", false, ["Male", "Female", "Other"]], ["grade", "Grade", "number", true], ["className", "Class"], ["dateOfBirth", "Date of birth", "date"], ["email", "Email", "email"], ["phone", "Phone"], ["parentName", "Parent name"], ["parentPhone", "Parent phone"], ["address", "Address"], ["status", "Status", "select", false, ["Active", "Inactive", "Graduated"]]],
  teachers: [["teacherId", "Teacher ID", "text", true], ["firstName", "First name", "text", true], ["lastName", "Last name", "text", true], ["email", "Email", "email"], ["phone", "Phone"], ["department", "Department"], ["qualification", "Qualification"], ["status", "Status", "select", false, ["Active", "On leave", "Inactive"]]],
  parents: [["name", "Parent name", "text", true], ["phone", "Phone", "text", true], ["email", "Email", "email"], ["address", "Address"], ["students", "Linked student record IDs (comma separated)", "array"]],
  classes: [["name", "Class name", "text", true], ["grade", "Grade", "number", true], ["section", "Section", "text", true], ["academicYear", "Academic year"], ["room", "Room"], ["capacity", "Capacity", "number"]],
  subjects: [["name", "Subject name", "text", true], ["code", "Subject code", "text", true], ["grade", "Grade", "number"], ["description", "Description"]],
  attendance: [["student", "Student record ID", "text", true], ["date", "Date", "date", true], ["status", "Status", "select", true, ["Present", "Absent", "Late", "Excused"]], ["note", "Note"]],
  enrollments: [["student", "Student record ID", "text", true], ["schoolClass", "Class record ID", "text", true], ["academicYear", "Academic year", "text", true], ["enrolledAt", "Enrollment date", "date"], ["status", "Status", "select", false, ["Active", "Transferred", "Completed"]]],
  examinations: [["name", "Exam name", "text", true], ["subject", "Subject record ID"], ["schoolClass", "Class record ID"], ["semester", "Semester"], ["academicYear", "Academic year"], ["date", "Exam date", "date"], ["maxScore", "Maximum score", "number"]],
  grades: [["student", "Student record ID", "text", true], ["examination", "Examination ID", "text", true], ["score", "Score", "number", true], ["letter", "Letter grade", "select", false, ["A", "B", "C", "D", "E", "F"]], ["remarks", "Remarks"]],
  timetable: [["schoolClass", "Class record ID"], ["subject", "Subject record ID"], ["teacher", "Teacher record ID"], ["day", "Day", "select", true, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]], ["startTime", "Start time", "time", true], ["endTime", "End time", "time", true], ["room", "Room"]],
  "academic-years": [["name", "Academic year", "text", true], ["startDate", "Start date", "date"], ["endDate", "End date", "date"], ["status", "Status", "select", false, ["Active", "Planned", "Completed"]]],
  semesters: [["name", "Semester name", "text", true], ["academicYear", "Academic year record ID"], ["startDate", "Start date", "date"], ["endDate", "End date", "date"], ["status", "Status", "select", false, ["Active", "Planned", "Completed"]]],
  fees: [["name", "Fee name", "text", true], ["grade", "Grade", "number"], ["amount", "Amount (USD)", "number", true], ["dueDate", "Due date", "date"], ["academicYear", "Academic year"], ["description", "Description"]],
  payments: [["student", "Student record ID", "text", true], ["amount", "Amount (USD)", "number", true], ["paidAt", "Payment date", "date"], ["method", "Payment method", "select", false, ["Cash", "Bank transfer", "Mobile payment"]], ["status", "Status", "select", false, ["Paid", "Pending", "Refunded"]]],
  books: [["title", "Book title", "text", true], ["author", "Author"], ["isbn", "ISBN"], ["category", "Category"], ["copies", "Copies", "number"], ["availableCopies", "Available copies", "number"]],
  announcements: [["title", "Title", "text", true], ["body", "Message", "textarea", true], ["audience", "Audience", "select", false, ["All", "Staff", "Students", "Parents"]]],
  notifications: [["user", "User record ID"], ["title", "Title", "text", true], ["body", "Message"], ["read", "Read", "select", false, ["true", "false"]]],
  "library-transactions": [["book", "Book record ID", "text", true], ["student", "Student record ID", "text", true], ["borrowedAt", "Borrowed date", "date"], ["dueAt", "Due date", "date"], ["returnedAt", "Returned date", "date"], ["status", "Status", "select", false, ["Borrowed", "Returned", "Overdue"]]],
  "audit-logs": [["action", "Action", "text", true], ["entity", "Resource"], ["recordId", "Record ID"]],
};

const columns = {
  students: [["studentId", "Student ID"], ["firstName", "First name"], ["lastName", "Last name"], ["grade", "Grade"], ["className", "Class"], ["status", "Status"]],
  teachers: [["teacherId", "Teacher ID"], ["firstName", "First name"], ["lastName", "Last name"], ["department", "Department"], ["phone", "Phone"], ["status", "Status"]],
  parents: [["name", "Name"], ["phone", "Phone"], ["email", "Email"]],
  classes: [["name", "Class"], ["grade", "Grade"], ["section", "Section"], ["academicYear", "Academic year"], ["capacity", "Capacity"]],
  subjects: [["code", "Code"], ["name", "Subject"], ["grade", "Grade"], ["description", "Description"]],
  attendance: [["student", "Student"], ["date", "Date"], ["status", "Status"], ["note", "Note"]],
  examinations: [["name", "Examination"], ["semester", "Semester"], ["academicYear", "Academic year"], ["date", "Date"], ["maxScore", "Max score"]],
  grades: [["student", "Student"], ["examination", "Examination"], ["score", "Score"], ["letter", "Grade"], ["remarks", "Remarks"]],
  timetable: [["day", "Day"], ["startTime", "Start"], ["endTime", "End"], ["room", "Room"]],
  fees: [["name", "Fee"], ["grade", "Grade"], ["amount", "Amount"], ["dueDate", "Due date"], ["academicYear", "Academic year"]],
  payments: [["student", "Student"], ["amount", "Amount"], ["method", "Method"], ["status", "Status"], ["paidAt", "Date"]],
  books: [["title", "Title"], ["author", "Author"], ["isbn", "ISBN"], ["category", "Category"], ["availableCopies", "Available"]],
  announcements: [["title", "Title"], ["audience", "Audience"], ["publishedAt", "Published"]],
};
const singularLabels = {
  students: "student", teachers: "teacher", parents: "parent", classes: "class",
  subjects: "subject", attendance: "attendance record", examinations: "examination",
  grades: "grade", timetable: "timetable entry", enrollments: "enrollment",
  "academic-years": "academic year", semesters: "semester", fees: "fee",
  payments: "payment", books: "book", announcements: "announcement",
  notifications: "notification", "library-transactions": "library transaction",
  "audit-logs": "audit log",
};

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("svhs_user")); } catch { return null; }
  });
  const [authChecking, setAuthChecking] = useState(() => Boolean(localStorage.getItem("svhs_token") && localStorage.getItem("svhs_user")));
  const [authRetry, setAuthRetry] = useState(0);
  const [sessionError, setSessionError] = useState("");
  const [dark, setDark] = useState(() => localStorage.getItem("svhs_theme") === "dark");
  const [khmer, setKhmer] = useState(() => localStorage.getItem("svhs_language") === "km");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("svhs_theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    document.documentElement.lang = khmer ? "km" : "en";
    localStorage.setItem("svhs_language", khmer ? "km" : "en");
  }, [khmer]);
  useEffect(() => {
    if (!authChecking) return;
    request(api.get("/auth/me"))
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem("svhs_user", JSON.stringify(data));
      })
      .catch((error) => {
        if (error.status === 401) {
          localStorage.removeItem("svhs_token");
          localStorage.removeItem("svhs_user");
          setUser(null);
        } else {
          setSessionError(error.message);
        }
      })
      .finally(() => setAuthChecking(false));
  }, [authRetry]);
  const signOut = () => {
    localStorage.removeItem("svhs_token");
    localStorage.removeItem("svhs_user");
    setUser(null);
  };

  if (authChecking) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500"><LoaderCircle className="mr-2 animate-spin" size={18} />Checking your session...</div>;
  if (sessionError) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5"><div className="surface max-w-md p-7 text-center"><h1 className="text-lg font-semibold">Unable to verify your session</h1><p className="mt-2 text-sm text-slate-500">{sessionError}</p><div className="mt-5 flex justify-center gap-2"><button onClick={() => { setSessionError(""); setAuthChecking(true); setAuthRetry((value) => value + 1); }} className="btn-primary">Retry</button><button onClick={() => { localStorage.removeItem("svhs_token"); localStorage.removeItem("svhs_user"); setUser(null); setSessionError(""); }} className="btn-secondary">Sign in again</button></div></div></main>;
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={setUser} />} />
    <Route path="/*" element={user ? <Shell user={user} dark={dark} setDark={setDark} khmer={khmer} setKhmer={setKhmer} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} signOut={signOut} /> : <Navigate to="/login" replace />} />
  </Routes>;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await request(api.post("/auth/login", { email, password }));
      localStorage.setItem("svhs_token", data.token);
      localStorage.setItem("svhs_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
    <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-800 to-slate-950 p-10 text-white md:flex">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-white/15 p-3"><GraduationCap size={24} /></span><span className="font-semibold">SV HIGH SCHOOL</span></div>
        <div><p className="mb-3 text-sm font-semibold uppercase tracking-[.2em] text-blue-200">Learning. Growing. Together.</p><h1 className="text-4xl font-semibold leading-tight">A brighter future starts in the classroom.</h1><p className="mt-4 text-sm leading-6 text-blue-100">One connected place for school operations, student progress, and family engagement.</p></div>
        <p className="text-sm text-blue-200">School Management System · Cambodia</p>
      </div>
      <form onSubmit={submit} className="p-8 sm:p-12">
        <div className="mb-10 flex items-center gap-3 md:hidden"><span className="rounded-xl bg-blue-700 p-3 text-white"><GraduationCap size={22} /></span><strong>SV HIGH SCHOOL</strong></div>
        <p className="text-sm font-semibold text-blue-700">WELCOME BACK</p><h2 className="mt-2 text-3xl font-semibold text-slate-900">Sign in to your account</h2>
        <p className="mt-2 text-sm text-slate-500">Enter your school account details below.</p>
        {error && <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <label className="mt-7 block text-sm font-medium text-slate-700">Email address<input required type="email" autoComplete="username" className="input mt-2" placeholder="name@svschool.edu.kh" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="mt-5 block text-sm font-medium text-slate-700">Password<input required type="password" autoComplete="current-password" className="input mt-2" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button disabled={busy} className="btn-primary mt-7 w-full py-3">{busy ? <LoaderCircle className="animate-spin" size={18} /> : "Sign in"}</button>
        <p className="mt-6 text-center text-xs leading-5 text-slate-400">Ask your school administrator for account access.<br />Demo account is created with the backend seed command.</p>
      </form>
    </div>
  </main>;
}

function Shell({ user, dark, setDark, khmer, setKhmer, mobileOpen, setMobileOpen, signOut }) {
  const name = user.name || user.email;
  const visibleModules = user.role === "student"
    ? modules.filter(({ key }) => ["dashboard", "students", "attendance", "grades", "timetable", "announcements"].includes(key))
    : user.role === "parent"
      ? modules.filter(({ key }) => ["dashboard", "students", "attendance", "grades", "timetable", "payments", "announcements"].includes(key))
      : user.role === "teacher"
        ? modules.filter(({ key }) => ["dashboard", "students", "subjects", "attendance", "examinations", "grades", "timetable", "books", "announcements", "reports"].includes(key))
        : modules;
  const nav = <nav className="space-y-1 px-3 py-4">
    <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-500">{khmer ? "ម៉ឺនុយចម្បង" : "Main menu"}</p>
    {visibleModules.map((item) => {
      const Icon = item.icon;
      return <NavLink key={item.key} to={item.key === "dashboard" ? "/" : `/${item.key}`} onClick={() => setMobileOpen(false)}
        className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
        <Icon size={17} strokeWidth={1.8} /><span className="flex-1">{khmer ? item.km : item.label}</span>{item.key === "dashboard" && <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />}
      </NavLink>;
    })}
  </nav>;
  return <div className="min-h-screen bg-slate-50 dark:bg-[#0b1220]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#0f172a] lg:flex">
      <Brand />{nav}<div className="mt-auto border-t border-slate-800 p-4"><div className="flex items-center gap-3 rounded-lg bg-slate-800/70 p-3"><Avatar name={name} /><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{name}</p><p className="truncate text-xs capitalize text-slate-400">{user.role?.replace("_", " ")}</p></div></div></div>
    </aside>
    {mobileOpen && <div className="fixed inset-0 z-40 lg:hidden"><button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-950/60" /><aside className="relative flex h-full w-72 flex-col bg-[#0f172a]"><div className="flex items-center justify-between"><Brand /><button className="mr-3 text-slate-300" onClick={() => setMobileOpen(false)}><X size={20} /></button></div>{nav}</aside></div>}
    <div className="lg:pl-64">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-[#111c2f]/95 sm:px-7">
        <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"><Menu size={20} /></button><div className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 sm:flex"><Search size={15} /><span>School operations</span><kbd className="ml-8 rounded border bg-white px-1.5 py-0.5 text-[10px]">⌘ K</kbd></div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100 sm:hidden">SV School</p></div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button title="Switch language" onClick={() => setKhmer(!khmer)} className="flex items-center gap-1.5 rounded-lg p-2 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-300"><Languages size={17} /><span className="hidden sm:inline">{khmer ? "ខ្មែរ" : "EN"}</span></button>
          <button title="Toggle theme" onClick={() => setDark(!dark)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button title="Sign out" onClick={signOut} className="flex items-center gap-2 rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-300"><LogOut size={18} /><span className="hidden text-sm sm:inline">Sign out</span></button>
          <Avatar name={name} />
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] p-4 sm:p-7"><Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        {["super_admin", "admin", "teacher"].includes(user.role) && <Route path="/reports" element={<Reports />} />}
        {["super_admin", "admin"].includes(user.role) && <Route path="/settings" element={<SettingsPage user={user} />} />}
        {modules.filter(({ key }) => !["dashboard", "reports", "settings"].includes(key)).map(({ key }) => <Route key={key} path={`/${key}`} element={<ResourcePage />} />)}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes></main>
    </div>
  </div>;
}

function Brand() {
  return <div className="flex h-[68px] items-center gap-3 border-b border-slate-800 px-5"><div className="rounded-xl bg-blue-600 p-2.5 text-white"><GraduationCap size={21} /></div><div><p className="text-sm font-bold tracking-wide text-white">SV HIGH SCHOOL</p><p className="mt-0.5 text-[10px] text-slate-400">MANAGEMENT SYSTEM</p></div></div>;
}
function Avatar({ name = "User" }) {
  return <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold uppercase text-blue-800">{name.split(/[\s@]/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("")}</div>;
}
function PageTitle({ eyebrow, title, description, children }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.15em] text-blue-700">{eyebrow}</p><h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{title}</h1>{description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}</div>{children}</div>;
}

function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    request(api.get("/dashboard")).then((result) => { if (active) setData(result.data); })
      .catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const cards = [
    { label: "Total students", value: data?.students, icon: GraduationCap, tint: "blue", change: "Grades 7–12", href: "/students" },
    { label: "Teaching staff", value: data?.teachers, icon: Users, tint: "violet", change: "Active teachers", href: "/teachers" },
    { label: "Classes", value: data?.classes, icon: ClipboardList, tint: "amber", change: "Across grade levels", href: "/classes" },
    { label: "Parents", value: data?.parents, icon: Users, tint: "green", change: "Registered families", href: "/parents" },
  ];
  const canManageRecords = ["super_admin", "admin"].includes(user.role);
  const visibleCards = canManageRecords
    ? cards
    : cards.filter(({ href }) => href === "/students" && ["student", "parent"].includes(user.role));
  return <>
    <PageTitle eyebrow={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} title={`Good morning, ${user.name?.split(" ")[0] || "Administrator"} 👋`} description="Here’s what’s happening at your school today." />
    {error && <ErrorBanner message={error} />}
    {loading ? <Loading /> : visibleCards.length > 0 && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{visibleCards.map(({ label, value, icon: Icon, tint, change, href }) => <Link key={label} to={href} className="surface group block p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{Number(value || 0).toLocaleString()}</p></div><span className={`rounded-xl p-3 ${tint === "blue" ? "bg-blue-50 text-blue-700" : tint === "violet" ? "bg-violet-50 text-violet-700" : tint === "amber" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}><Icon size={20} /></span></div><div className="mt-4 flex items-center gap-1 text-xs text-slate-500"><ArrowUpRight size={14} className="text-green-600" />{change}<span className="ml-auto font-medium text-blue-700 opacity-0 transition group-hover:opacity-100">View records</span></div></Link>)}</div>}
    <div className="mt-6 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
      <section className="surface p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900 dark:text-white">Attendance overview</h2><p className="mt-1 text-sm text-slate-500">Today’s recorded attendance</p></div><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">{data?.attendancePercent || 0}% present</span></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs text-slate-500">Students recorded</p><p className="mt-2 text-2xl font-semibold">{data?.attendanceToday || 0}</p></div><div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/40"><p className="text-xs text-blue-700 dark:text-blue-300">Collected payments</p><p className="mt-2 text-2xl font-semibold">${Number(data?.revenue || 0).toLocaleString()}</p></div></div><div className="mt-5 h-44"><ResponsiveContainer width="100%" height="100%"><AreaChart data={[{ day: "Today", value: data?.attendancePercent || 0 }]} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}><defs><linearGradient id="attendance" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} /><Tooltip /><Area type="monotone" dataKey="value" name="Attendance %" stroke="#2563eb" fill="url(#attendance)" strokeWidth={2.5} /></AreaChart></ResponsiveContainer></div></section>
      <section className="surface p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900 dark:text-white">Recent students</h2><p className="mt-1 text-sm text-slate-500">Latest registrations</p></div><GraduationCap className="text-blue-600" size={19} /></div><div className="mt-5 space-y-4">{(data?.recentStudents || []).length ? data.recentStudents.map((student) => <div key={student._id} className="flex items-center gap-3"><Avatar name={`${student.firstName} ${student.lastName}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{student.firstName} {student.lastName}</p><p className="text-xs text-slate-500">{student.studentId} · Grade {student.grade}</p></div><span className="rounded-md bg-green-50 px-2 py-1 text-[10px] text-green-700">{student.className || "New"}</span></div>) : <EmptyState title="No student registrations yet" detail="Add students to see recent activity here." />}</div></section>
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-2"><section className="surface p-5"><h2 className="font-semibold text-slate-900 dark:text-white">School activity</h2><p className="mt-1 text-sm text-slate-500">A quick overview of your school day</p><div className="mt-5 space-y-3">{[["Attendance", `${data?.attendanceToday || 0} student records for today`, Check], ["Academic year", "2026–2027 · Semester 1", CalendarDays], ["Finance", `$${Number(data?.revenue || 0).toLocaleString()} recorded payments`, Wallet]].map(([title, detail, Icon]) => <div key={title} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><span className="rounded-lg bg-white p-2 text-blue-700 shadow-sm dark:bg-slate-700"><Icon size={17} /></span><div><p className="text-sm font-medium">{title}</p><p className="text-xs text-slate-500">{detail}</p></div></div>)}</div></section><section className="surface p-5"><h2 className="font-semibold text-slate-900 dark:text-white">Announcements</h2><p className="mt-1 text-sm text-slate-500">Latest school notices</p><div className="mt-4 space-y-3">{(data?.recentAnnouncements || []).length ? data.recentAnnouncements.map((item) => <div key={item._id} className="border-l-2 border-blue-500 py-1 pl-3"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.audience} · {new Date(item.publishedAt).toLocaleDateString()}</p></div>) : <EmptyState title="No announcements yet" detail="Published school notices will appear here." />}</div></section></div>
  </>;
}

function ResourcePage() {
  const { pathname } = useLocation();
  const moduleKey = pathname.split("/")[1];
  const module = modules.find((item) => item.key === moduleKey);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const fields = moduleFields[moduleKey];
  const tableColumns = columns[moduleKey];
  const load = useCallback(async (page = 1, searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const result = await request(api.get(`/${moduleKey}`, { params: { page, limit: 10, search: searchTerm || undefined } }));
      setItems(result.data);
      setPagination(result.pagination);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [moduleKey]);
  useEffect(() => { load(1); }, [load]);
  const filteredColumns = tableColumns || (items[0] ? Object.keys(items[0]).filter((key) => !["_id", "__v", "createdAt", "updatedAt"].includes(key)).slice(0, 6).map((key) => [key, humanize(key)]) : []);
  const save = async (values) => {
    setSaving(true);
    try {
      if (editing?._id) await request(api.patch(`/${moduleKey}/${editing._id}`, values));
      else await request(api.post(`/${moduleKey}`, values));
      setEditing(null);
      setNotice(editing?._id ? "Record updated successfully." : "Record created successfully.");
      await load(pagination.page);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!window.confirm("Delete this record? This action cannot be undone.")) return;
    try {
      await request(api.delete(`/${moduleKey}/${item._id}`));
      setNotice("Record deleted successfully.");
      await load(pagination.page);
    } catch (err) { setError(err.message); }
  };
  if (!module) return <ErrorBanner message="This module is not available." />;
  const Icon = module.icon;
  return <>
    <PageTitle eyebrow="School records" title={module.label} description={`Manage and review ${module.label.toLowerCase()} records.`}>
      <button onClick={() => setEditing({})} className="btn-primary"><Plus size={17} />Add {singularLabels[moduleKey]}</button>
    </PageTitle>
    {notice && <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800"><span>{notice}</span><button aria-label="Dismiss" onClick={() => setNotice("")}><X size={16} /></button></div>}
    {error && <ErrorBanner message={error} />}
    <section className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold">{module.label} directory</h2><p className="mt-1 text-xs text-slate-500">{pagination.total} records</p></div><form onSubmit={(e) => { e.preventDefault(); setSearch(query); load(1, query); }} className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={15} /><input className="input w-full pl-9 sm:w-64" placeholder={`Search ${module.label.toLowerCase()}...`} value={query} onChange={(e) => setQuery(e.target.value)} /></div><button className="btn-secondary">Search</button></form></div>
      {loading ? <Loading /> : items.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/60"><tr>{filteredColumns.map(([field, label]) => <th key={field} className="px-5 py-3 font-medium">{label}</th>)}<th className="px-5 py-3 text-right font-medium">Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item._id} className="table-row border-t border-slate-100 hover:bg-slate-50/70 dark:hover:bg-slate-800/50">{filteredColumns.map(([field]) => <td key={field} className="max-w-[220px] truncate px-5 py-3.5 text-slate-600 dark:text-slate-300">{formatValue(item[field])}</td>)}<td className="px-5 py-3.5"><div className="flex justify-end gap-1"><button title="Edit record" onClick={() => setEditing(item)} className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Pencil size={15} /></button><button title="Delete record" onClick={() => remove(item)} className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800"><span>Page {pagination.page} of {Math.max(1, pagination.pages)}</span><div className="flex gap-2"><button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="btn-secondary px-2 py-1.5"><ChevronLeft size={15} />Previous</button><button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)} className="btn-secondary px-2 py-1.5">Next<ChevronRight size={15} /></button></div></div></> : <div className="py-16"><EmptyState icon={Icon} title={`No ${module.label.toLowerCase()} found`} detail="Add a record to get started." /></div>}
    </section>
    {editing && <RecordDialog module={module} singular={singularLabels[moduleKey]} fields={fields} initial={editing} saving={saving} onClose={() => setEditing(null)} onSave={save} />}
  </>;
}

function RecordDialog({ module, singular, fields = [], initial, saving, onClose, onSave }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(([key]) => [key, initial[key] ?? ""])));
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const payload = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
    for (const [key, , type] of fields) {
      if (type === "number" && payload[key] !== undefined) payload[key] = Number(payload[key]);
      if (type === "array" && payload[key] !== undefined) payload[key] = payload[key].split(",").map((value) => value.trim()).filter(Boolean);
      if (type === "select" && key === "read" && payload[key] !== undefined) payload[key] = payload[key] === "true";
    }
    try { await onSave(payload); } catch (err) { setError(err.message); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#111c2f] sm:p-7"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{initial._id ? "Update record" : "New record"}</p><h2 className="mt-1 text-xl font-semibold">{initial._id ? "Edit" : "Add"} {singular}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
    {error && <ErrorBanner message={error} />}
    <div className="grid gap-4 sm:grid-cols-2">    {fields.map(([key, label, type = "text", required, options]) => <label key={key} className={`${type === "textarea" || type === "array" ? "sm:col-span-2" : ""} block text-sm font-medium text-slate-700 dark:text-slate-200`}>{label}{type === "select" ? <select required={required} className="input mt-1.5" value={values[key] ?? ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })}><option value="">Select...</option>{options.map((option) => <option key={option}>{option}</option>)}</select> : type === "textarea" ? <textarea required={required} rows={4} className="input mt-1.5" value={values[key] ?? ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} /> : <input required={required} type={type === "array" ? "text" : type} min={type === "number" && key === "grade" ? 7 : undefined} max={type === "number" && key === "grade" ? 12 : undefined} className="input mt-1.5" value={type === "array" && Array.isArray(values[key]) ? values[key].join(", ") : values[key] ?? ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />}</label>)}</div>
    <div className="mt-7 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button disabled={saving} className="btn-primary">{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}{initial._id ? "Save changes" : "Create record"}</button></div>
  </form></div>;
}

function Reports() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { request(api.get("/dashboard")).then(({ data }) => setStats(data)).catch((err) => setError(err.message)); }, []);
  const exportCsv = () => {
    if (!stats) return;
    const rows = [["Report", "Value"], ["Total students", stats.students], ["Total teachers", stats.teachers], ["Classes", stats.classes], ["Parents", stats.parents], ["Attendance today", stats.attendanceToday], ["Attendance percentage", `${stats.attendancePercent}%`], ["Payments collected", stats.revenue]];
    const csv = rows.map((row) => row.map((field) => `"${String(field ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `sv-school-summary-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return <><PageTitle eyebrow="Analytics" title="Reports" description="A live snapshot of school operations." /><div className="surface flex flex-col items-center justify-center py-16 text-center"><div className="rounded-2xl bg-blue-50 p-4 text-blue-700"><Activity size={28} /></div><h2 className="mt-4 text-lg font-semibold">School summary report</h2><p className="mt-2 max-w-md text-sm text-slate-500">Export current enrollment, attendance, and finance totals for a quick school overview.</p>{error && <div className="mt-4"><ErrorBanner message={error} /></div>}<button disabled={!stats} onClick={exportCsv} className="btn-primary mt-6"><ArrowDownRight size={16} />Download summary CSV</button></div></>;
}

function SettingsPage({ user }) {
  return <><PageTitle eyebrow="Administration" title="Settings" description="School account and system configuration." /><section className="surface max-w-3xl p-6"><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-700"><Shield size={20} /></span><div><h2 className="font-semibold">Signed-in account</h2><p className="text-sm text-slate-500">Account details and access role</p></div></div><dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Name</dt><dd className="mt-1 text-sm font-medium">{user.name}</dd></div><div><dt className="text-xs text-slate-500">Email</dt><dd className="mt-1 text-sm font-medium">{user.email}</dd></div><div><dt className="text-xs text-slate-500">Role</dt><dd className="mt-1 text-sm font-medium capitalize">{user.role?.replace("_", " ")}</dd></div></dl><p className="mt-6 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">User and school configuration changes are restricted to authorized administrators and are managed through the secured backend.</p></section></>;
}

function humanize(value) { return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()); }
function formatValue(value) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "object") return value.name || value.studentId || value._id || JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value)) return new Date(value).toLocaleDateString();
  return String(value);
}
function Loading() { return <div className="flex items-center justify-center py-16 text-sm text-slate-500"><LoaderCircle className="mr-2 animate-spin" size={18} />Loading school records...</div>; }
function EmptyState({ icon: Icon = BookOpen, title, detail }) { return <div className="px-5 text-center"><Icon className="mx-auto text-slate-300" size={26} /><p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>; }
function ErrorBanner({ message }) { return <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>; }

export default App;
