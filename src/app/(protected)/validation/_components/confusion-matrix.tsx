import type { ConfusionMatrix as ConfusionMatrixType } from '@/lib/validation/statistics'

interface ConfusionMatrixProps {
  matrix: ConfusionMatrixType
}

export function ConfusionMatrix({ matrix }: ConfusionMatrixProps) {
  const labels = matrix.labels.map(l => l.charAt(0).toUpperCase() + l.slice(1))

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left"></th>
              <th colSpan={3} className="p-2 text-center text-xs text-muted-foreground">
                Expert (Actual)
              </th>
            </tr>
            <tr>
              <th className="p-2 text-left text-xs text-muted-foreground">AI (Predicted)</th>
              {labels.map(label => (
                <th key={label} className="p-2 text-center font-medium">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.matrix.map((row, i) => (
              <tr key={i}>
                <td className="p-2 font-medium">{labels[i]}</td>
                {row.map((count, j) => {
                  const isDiagonal = i === j
                  return (
                    <td
                      key={j}
                      className={`p-2 text-center border ${
                        isDiagonal
                          ? 'bg-green-50 dark:bg-green-950 font-bold'
                          : count > 0
                            ? 'bg-red-50 dark:bg-red-950'
                            : ''
                      }`}
                    >
                      {count}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Diagonal (green) = agreement. Off-diagonal (red) = disagreement. Total: {matrix.total}
      </p>
    </div>
  )
}
