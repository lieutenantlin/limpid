import { type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="surface rounded-[2rem] border-0">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <p className="eyebrow">{label}</p>
          <CardTitle className="mt-2 text-3xl font-semibold">{value}</CardTitle>
        </div>
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-muted-foreground">{detail}</CardContent>
    </Card>
  );
}
