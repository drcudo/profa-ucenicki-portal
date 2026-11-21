import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const PRIMARY = 'hsl(250 80% 60%)';
const WEAK = 'hsl(32 95% 50%)';
const MUTED = 'hsl(227 8% 40%)';

function UnitTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">{row.full}</p>
      <p className="mt-0.5 text-muted-foreground">{row.pct}% uspješnost</p>
    </div>
  );
}

export default function UnitBarChart({ data }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(0 0% 89.8%)" />
          <XAxis
            dataKey="name"
            interval={0}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: MUTED }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            width={44}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: MUTED }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<UnitTooltip />} cursor={{ fill: 'hsl(227 11% 24% / 0.04)' }} />
          <Bar dataKey="pct" radius={[6, 6, 0, 0]} maxBarSize={46}>
            {data.map((row) => (
              <Cell key={row.full} fill={row.pct < 50 ? WEAK : PRIMARY} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}