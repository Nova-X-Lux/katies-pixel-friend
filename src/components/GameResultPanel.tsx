import { PixelIcon } from "./PixelIcon";

interface GameResultPanelProps {
  title: string;
  score: number;
  previousBest: number;
  coinsEarned: number;
  onReplay: () => void;
  onBack: () => void;
  overlay?: boolean;
}

export function GameResultPanel({
  title,
  score,
  previousBest,
  coinsEarned,
  onReplay,
  onBack,
  overlay = false,
}: GameResultPanelProps) {
  const isNewBest = score > previousBest;
  return (
    <article className={`game-result ${overlay ? "game-result--overlay" : ""}`} role="status" aria-live="polite">
      <PixelIcon name={coinsEarned > 0 ? "coin" : "heart"} size={46} />
      {isNewBest && <span className="new-best">New best!</span>}
      <h2>{title}</h2>
      <div className="result-stats">
        <span><small>Score</small><strong>{score}</strong></span>
        <span><small>Previous best</small><strong>{previousBest}</strong></span>
        <span><small>Coins earned</small><strong>+{coinsEarned}</strong></span>
      </div>
      {coinsEarned === 0 && <p>Catch at least one treat to bring home coins.</p>}
      <div className="result-actions">
        <button className="primary-button" onClick={onReplay}>Play again</button>
        <button className="text-button" onClick={onBack}>Back to games</button>
      </div>
    </article>
  );
}
