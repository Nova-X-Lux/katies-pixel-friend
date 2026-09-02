import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "./PixelIcon";

const ROUND_SECONDS = 15;

const rewardFor = (score: number) => score === 0 ? 0 : 5 + Math.floor(score / 2);

function nextSpot() {
  return {
    x: 12 + Math.round(Math.random() * 76),
    y: 14 + Math.round(Math.random() * 68),
  };
}

export function FireflyGame({
  onFinish,
  onBack,
}: {
  onFinish: (score: number, coins: number) => void;
  onBack: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [spot, setSpot] = useState(nextSpot);
  const awarded = useRef(false);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!finished || awarded.current) return;
    awarded.current = true;
    onFinish(score * 100, rewardFor(score));
  }, [finished, onFinish, score]);

  function start() {
    awarded.current = false;
    setScore(0);
    setTimeLeft(ROUND_SECONDS);
    setSpot(nextSpot());
    setFinished(false);
    setRunning(true);
  }

  function catchGlow() {
    if (!running) return;
    setScore((current) => current + 1);
    setSpot(nextSpot());
  }

  const reward = rewardFor(score);

  return (
    <section className="mini-game mini-game--firefly">
      <header className="screen-heading">
        <button onClick={onBack} className="back-button">‹ Games</button>
        <div><p>Firefly glow</p><h1>Light the garden</h1></div>
        <span className="move-count">{timeLeft}s</span>
      </header>

      <div className="firefly-field" aria-label="Moonlit firefly garden">
        <i className="firefly-stars" aria-hidden="true" />
        {running && (
          <button
            className="firefly-target"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            onClick={catchGlow}
            aria-label="Catch the glowing firefly"
          >
            <PixelIcon name="sparkle" size={42} />
          </button>
        )}

        {!running && (
          <div className="game-overlay">
            <PixelIcon name={finished ? "star" : "moon"} size={54} />
            <h2>{finished ? `${score} little lights!` : "The garden is twinkling"}</h2>
            <p>{finished ? `You brought home ${reward} coins.` : "Tap each firefly before it flits away."}</p>
            <button className="primary-button" onClick={start}>{finished ? "Glow again" : "Start glowing"}</button>
            <button className="text-button" onClick={onBack}>Back to games</button>
          </div>
        )}
      </div>
      <p className="score-readout"><strong>{score}</strong> fireflies found</p>
    </section>
  );
}
