import { motion } from "motion/react";
import {
  ArrowRightLeft,
  Bot,
  Building2,
  Gauge,
  Headset,
  Inbox,
  MessageCircle,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL, SIDEBAR_ITEMS } from "@/modules/whatsapp/constants";
import type { Agent, DashboardMetrics } from "@/modules/whatsapp/types";

const ICON_MAP = {
  Gauge,
  Wifi,
  Inbox,
  Building2,
  Headset,
  Bot,
  ShieldCheck,
} as const;

interface SidebarProps {
  tenantId: string;
  currentAgent: Agent;
  metrics: DashboardMetrics;
  activeTab: string;
  collapsed: boolean;
  pendingCount: number;
  onTabChange: (tab: string) => void;
  onToggleCollapse: () => void;
}

export function Sidebar({
  tenantId,
  currentAgent,
  metrics,
  activeTab,
  collapsed,
  pendingCount,
  onTabChange,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={`glass border-r border-white/10 transition-all duration-300 ${
        collapsed ? "w-[88px]" : "w-[280px]"
      }`}
    >
      <div className="flex h-full flex-col p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <MessageCircle className="h-5 w-5" />
            </div>
            {!collapsed ? (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm font-semibold">W7 Atendimento</p>
                <p className="text-xs text-muted-foreground">
                  WhatsApp Multi-Tenant
                </p>
              </motion.div>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="shrink-0"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Tenant & Agent info */}
        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentAgent.avatarUrl} />
                <AvatarFallback className="bg-primary/20 text-xs text-primary">
                  {currentAgent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[oklch(0.185_0_0)] ${
                  currentAgent.online ? "bg-emerald-400" : "bg-slate-500"
                }`}
              />
            </div>
            {!collapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-medium">
                  {currentAgent.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABEL[currentAgent.role]}
                </p>
              </motion.div>
            ) : null}
          </div>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 border-t border-white/10 pt-2"
            >
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Empresa
              </p>
              <p className="mt-0.5 truncate text-xs font-medium">{tenantId}</p>
            </motion.div>
          ) : null}
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.iconName as keyof typeof ICON_MAP];
            const isActive = activeTab === item.value;
            const showBadge = item.value === "inbox" && pendingCount > 0;

            return (
              <button
                key={item.value}
                onClick={() => onTabChange(item.value)}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                {isActive ? (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                ) : null}
                <Icon className="relative z-10 h-4 w-4 shrink-0" />
                {!collapsed ? (
                  <span className="relative z-10">{item.label}</span>
                ) : null}
                {showBadge ? (
                  <Badge className="relative z-10 ml-auto h-5 min-w-5 justify-center bg-primary px-1.5 text-[10px] text-primary-foreground">
                    {pendingCount}
                  </Badge>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Footer: Connection status */}
        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            {metrics.connectedNumbers > 0 ? (
              <Wifi className="h-4 w-4 text-primary" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
            {!collapsed ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground"
              >
                {metrics.connectedNumbers} número
                {metrics.connectedNumbers !== 1 ? "s" : ""} online
              </motion.p>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
