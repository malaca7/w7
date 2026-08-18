import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, MessageSquare, MessagesSquare, Users, Smartphone,
  Bot, Calendar, Megaphone, CreditCard, Receipt, UserCog, Building2,
  BarChart3, Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  Search, Menu, X, UserCircle, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { W7Logo } from "@/components/landing/W7Logo";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: "/auth/login", search: { redirect: location.href } });
    }
  },
  component: AppLayout,
});

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navGroups: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: "Visão Geral", to: "/app", icon: LayoutDashboard },
    ],
  },
  {
    label: "Atendimento",
    items: [
      { label: "Atendimento", to: "/app/atendimento", icon: MessageSquare },
      { label: "Conversas", to: "/app/conversas", icon: MessagesSquare },
      { label: "Clientes / CRM", to: "/app/clientes", icon: Users },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      { label: "WhatsApp", to: "/app/whatsapp", icon: Smartphone },
      { label: "Chatbot", to: "/app/chatbot", icon: Bot },
      { label: "IA Gemini", to: "/app/ia-gemini", icon: Sparkles },
      { label: "Agendamentos", to: "/app/agendamentos", icon: Calendar },
      { label: "Campanhas", to: "/app/campanhas", icon: Megaphone },
    ],
  },
  {
    label: "Gestão",
    items: [
      { label: "Financeiro", to: "/app/financeiro", icon: Receipt },
      { label: "Assinatura", to: "/app/assinatura", icon: CreditCard },
      { label: "Usuários", to: "/app/usuarios", icon: UserCog },
      { label: "Departamentos", to: "/app/departamentos", icon: Building2 },
    ],
  },
  {
    label: "Análise",
    items: [
      { label: "Relatórios", to: "/app/relatorios", icon: BarChart3 },
      { label: "Notificações", to: "/app/notificacoes", icon: Bell },
    ],
  },
];

function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const isActive = item.to === "/app"
    ? currentPath === "/app" || currentPath === "/app/"
    : currentPath.startsWith(item.to);

  return (
    <Link
      to={item.to}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        "hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground",
        collapsed && "justify-center px-2",
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground")} />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {!collapsed && item.badge != null && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function AppLayout() {
  const { authUser, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  const routerState = useRouterState();
  useEffect(() => setMobileOpen(false), [routerState.location.pathname]);

  const initials = authUser?.profile.full_name
    ? authUser.profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "W7";

  const Sidebar = (
    <aside
      className={cn(
        "flex flex-col h-full bg-[#0D0D0D] border-r border-border/50 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-14 border-b border-border/40 shrink-0", collapsed ? "justify-center px-2" : "px-4 gap-3")}>
        <Link to="/" aria-label="Ir para a página inicial" className={cn(collapsed ? "[writing-mode:vertical-rl] rotate-180" : "") }>
          <W7Logo className="h-6 w-auto" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && !collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: profile + settings */}
      <div className="border-t border-border/40 p-2 space-y-0.5 shrink-0">
        <Link
          to="/app/configuracoes"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? "Configurações" : undefined}
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-accent transition-colors",
                collapsed && "justify-center px-2",
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={authUser?.profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-bold">{initials}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium truncate text-foreground">{authUser?.profile.full_name ?? "Usuário"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{authUser?.company.name}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52">
            <DropdownMenuLabel>
              <p className="font-medium">{authUser?.profile.full_name}</p>
              <p className="text-xs text-muted-foreground font-normal">{authUser?.company.name}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/app/perfil" className="cursor-pointer">
                <UserCircle className="h-4 w-4 mr-2" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/app/configuracoes" className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute bottom-32 -right-3 z-20 h-6 w-6 rounded-full bg-border border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors hidden lg:flex"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );

  return (
    <div className="flex h-dvh bg-background overflow-hidden relative">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex relative shrink-0">{Sidebar}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 h-full">{Sidebar}</div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-border/50 bg-[#0D0D0D]/80 backdrop-blur-sm shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar…"
                className="w-full h-8 pl-9 pr-3 rounded-lg bg-accent/60 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link to="/app/notificacoes">
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
