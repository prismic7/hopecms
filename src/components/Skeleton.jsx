export function SkeletonRow({ cols = 4 }) {
  const css = `
    @keyframes shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    .sk-cell {
      height: 14px;
      border-radius: 6px;
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 400px 100%;
      animation: shimmer 1.2s infinite;
    }
  `
  return (
    <>
      <style>{css}</style>
      <tr>
        {Array.from({ length: cols }).map((_, i) => (
          <td key={i} style={{ padding: '12px 14px' }}>
            <div className="sk-cell" style={{ width: i === 0 ? '60%' : i === 1 ? '80%' : '50%' }} />
          </td>
        ))}
      </tr>
    </>
  )
}

export function SkeletonTable({ rows = 6, cols = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  )
}