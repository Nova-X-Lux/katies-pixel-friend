export function StatBar({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="stat">
      <div className="stat__label"><span>{label}</span><span>{Math.round(value)}</span></div>
      <div className="stat__track" aria-label={`${label}: ${Math.round(value)} out of 100`} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${value}%`, backgroundColor: tone }} />
      </div>
    </div>
  );
}
