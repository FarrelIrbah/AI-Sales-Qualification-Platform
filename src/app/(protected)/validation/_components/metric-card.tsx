interface MetricCardProps {
  label: string
  value: string | number
  detail?: string
  highlight?: boolean
}

export function MetricCard({ label, value, detail, highlight }: MetricCardProps) {
  return (
    <div className={`border rounded-lg p-4 ${highlight ? 'border-foreground/30 bg-muted/30' : ''}`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{typeof value === 'number' ? value.toFixed(3) : value}</p>
      {detail && <p className="text-xs text-muted-foreground mt-1">{detail}</p>}
    </div>
  )
}
