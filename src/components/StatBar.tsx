export function StatBar({ label, value, tone }: { label: string; value: number; tone: string }) {
  const displayedValue = Math.round(value);
  return (
    <div className="stat">
      <div className="stat__label"><span>{label}</span><span>{displayedValue}</span></div>
      <div className="stat__track" aria-label={`${label}: ${displayedValue} out of 100`} role="meter" aria-valuenow={displayedValue} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${value}%`, backgroundColor: tone }} />
      </div>
    </div>
  );
}
