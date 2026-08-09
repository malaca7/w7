import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/financeiro")({
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { authUser } = useAuth();
  const [type, setType] = useState<"all" | "income" | "expense">("all");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", authUser?.company.id, type],
    enabled: !!authUser?.company.id,
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb) return [];
      let q = sb.from("transactions")
        .select("*")
        .eq("company_id", authUser!.company.id)
        .order("occurred_at", { ascending: false })
        .limit(100);
      if (type !== "all") q = q.eq("type", type);
      const { data } = await q;
      return data ?? [];
    },
  });

  const totals = transactions.reduce(
    (acc: { income: number; expense: number }, t: any) => {
      if (t.type === "income") acc.income += Number(t.amount);
      else acc.expense += Number(t.amount);
      return acc;
    },
    { income: 0, expense: 0 },
  );
  const balance = totals.income - totals.expense;

  const fmt = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Financeiro"
        description="Controle de receitas e despesas"
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova transação
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Saldo</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={cn("text-2xl font-bold", balance >= 0 ? "text-primary" : "text-destructive")}>
              {fmt(balance)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Receitas</p>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">{fmt(totals.income)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Despesas</p>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-destructive">{fmt(totals.expense)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-card border border-border/50 rounded-lg w-fit">
        {(["all", "income", "expense"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "all" ? "Todos" : t === "income" ? "Receitas" : "Despesas"}
          </button>
        ))}
      </div>

      {/* Transactions table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-card animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma transação registrada</p>
          <Button className="mt-4 gap-2" size="sm">
            <Plus className="h-4 w-4" />
            Adicionar transação
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-card/50 hover:bg-card/50">
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t: any) => (
                <TableRow key={t.id} className="hover:bg-card/50">
                  <TableCell>
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center",
                      t.type === "income" ? "bg-green-500/10" : "bg-destructive/10",
                    )}>
                      {t.type === "income"
                        ? <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                        : <ArrowDownLeft className="h-3.5 w-3.5 text-destructive" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{t.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.category ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(parseISO(t.occurred_at), "d MMM yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold text-sm", t.type === "income" ? "text-green-500" : "text-destructive")}>
                    {t.type === "income" ? "+" : "-"}{fmt(Number(t.amount))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
