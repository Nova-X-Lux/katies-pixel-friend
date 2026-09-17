import { useEffect, useRef, useState } from "react";
import { getSnackPosition, getSnackStackReward, getSnackStackScore, landSnack, STACK_GOAL, STACK_START_WIDTH, type SnackLayer } from "../lib/snackStack";
import { GameResultPanel } from "./GameResultPanel";
import { PixelIcon } from "./PixelIcon";
import { playSound } from "../lib/sound";
import "./snack-stack.css";

type RoundStatus = "ready" | "playing" | "paused" | "done";
interface StackRound {
  status: RoundStatus;
  layers: SnackLayer[];
  perfects: number;
  previousBest: number;
  message: string;
}

const BASE: SnackLayer = { x: (100 - STACK_START_WIDTH) / 2, width: STACK_START_WIDTH };
const FLAVOURS = ["sponge", "berry", "chocolate", "cream"];

export function SnackStack({ previousBest, onFinish, onBack }: { previousBest: number; onFinish: (score: number, coins: number) => void; onBack: () => void }) {
  const [round, setRound] = useState<StackRound>({ status: "ready", layers: [], perfects: 0, previousBest, message: "A little balance. A lot of cake." });
  const roundRef = useRef(round);
  const movingRef = useRef<HTMLSpanElement>(null);
  const dropRef = useRef<HTMLButtonElement>(null);
  const resumeRef = useRef<HTMLButtonElement>(null);
  const elapsedRef = useRef(0);
  const movingXRef = useRef(0);
  const lastDropRef = useRef(0);
  const awardedRef = useRef(false);
  const count = round.layers.length;
  const top = round.layers[count - 1] ?? BASE;
  const score = getSnackStackScore(count, round.perfects);

  function publish(next: StackRound) {
    roundRef.current = next;
    setRound(next);
  }

  function start() {
    playSound("tap");
    awardedRef.current = false;
    elapsedRef.current = 0;
    movingXRef.current = 0;
    lastDropRef.current = performance.now();
    publish({ status: "playing", layers: [], perfects: 0, previousBest, message: "Line up the edges, then drop." });
    requestAnimationFrame(() => dropRef.current?.focus({ preventScroll: true }));
  }

  function pause() {
    if (roundRef.current.status === "playing") publish({ ...roundRef.current, status: "paused" });
  }

  function resume() {
    playSound("tap");
    publish({ ...roundRef.current, status: "playing" });
    requestAnimationFrame(() => dropRef.current?.focus({ preventScroll: true }));
  }

  function drop() {
    const current = roundRef.current;
    const now = performance.now();
    if (current.status !== "playing" || now - lastDropRef.current < 180) return;
    lastDropRef.current = now;
    const supported = current.layers[current.layers.length - 1] ?? BASE;
    const landing = landSnack(supported, movingXRef.current);
    const layers = landing.landed ? [...current.layers, landing.layer] : current.layers;
    const perfects = current.perfects + (landing.perfect ? 1 : 0);
    const done = !landing.landed || layers.length === STACK_GOAL;
    playSound(layers.length === STACK_GOAL ? "success" : landing.perfect ? "reward" : "drop");
    const message = !landing.landed ? "A little tumble!" : landing.perfect ? `Perfect! ${layers.length} ${layers.length === 1 ? "layer" : "layers"} stacked.` : `${layers.length} ${layers.length === 1 ? "layer" : "layers"} stacked. Keep it balanced.`;
    elapsedRef.current = 0;
    movingXRef.current = getSnackPosition(0, (layers[layers.length - 1] ?? BASE).width, layers.length);
    publish({ ...current, layers, perfects, status: done ? "done" : "playing", message });
    if (done && !awardedRef.current) {
      awardedRef.current = true;
      onFinish(getSnackStackScore(layers.length, perfects), getSnackStackReward(layers.length, perfects));
    }
  }

  useEffect(() => {
    if (round.status !== "playing") return;
    let frame = 0;
    let lastTime = performance.now();
    function animate(time: number) {
      if (roundRef.current.status !== "playing") return;
      // A slow frame should not fling the cake across the screen.
      elapsedRef.current += Math.min(50, Math.max(0, time - lastTime));
      lastTime = time;
      const current = roundRef.current;
      const width = (current.layers[current.layers.length - 1] ?? BASE).width;
      const x = getSnackPosition(elapsedRef.current, width, current.layers.length);
      movingXRef.current = x;
      if (movingRef.current) movingRef.current.style.left = `${x}%`;
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [round.status, count]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden && roundRef.current.status === "playing") {
        const next = { ...roundRef.current, status: "paused" as const };
        roundRef.current = next;
        setRound(next);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (round.status === "paused") resumeRef.current?.focus({ preventScroll: true });
  }, [round.status]);

  return (
    <section className="mini-game snack-stack" aria-label="Snack Stack game">
      <header className="screen-heading">
        <button onClick={onBack} className="back-button">‹ Games</button>
        <div><p>Snack stack</p><h1>One more layer</h1></div>
        <button className="back-button snack-pause" onClick={pause} disabled={round.status !== "playing"}>Pause</button>
      </header>

      <div className="snack-scoreboard">
        <span><small>Layers</small><strong>{count}<em> / {STACK_GOAL}</em></strong></span>
        <span><small>Perfects</small><strong>{round.perfects}</strong></span>
        <span><small>Score</small><strong>{score}</strong></span>
      </div>

      <div className="snack-field">
        <div className="snack-bunting" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div className="snack-window" aria-hidden="true"><span /></div>
        <div className="snack-goal-line" aria-hidden="true"><span>12 layers</span></div>
        <div className="snack-counter" aria-hidden="true" />
        <div className="snack-plate" aria-hidden="true" />
        <span className="snack-layer snack-layer--base" aria-hidden="true" style={{ left: `${BASE.x}%`, width: `${BASE.width}%`, bottom: "13%" }} />
        {round.layers.map((layer, index) => (
          <span key={index} className={`snack-layer snack-layer--${FLAVOURS[index % FLAVOURS.length]} snack-layer--landed`} aria-hidden="true" style={{ left: `${layer.x}%`, width: `${layer.width}%`, bottom: `${18 + index * 5}%` }} />
        ))}
        {(round.status === "playing" || round.status === "paused") && (
          <>
            <span className="snack-guide" aria-hidden="true" style={{ left: `${top.x}%`, width: `${top.width}%`, bottom: `${18 + count * 5}%` }} />
            <span ref={movingRef} className={`snack-layer snack-layer--moving snack-layer--${FLAVOURS[count % FLAVOURS.length]}`} aria-hidden="true" style={{ left: `${movingXRef.current}%`, width: `${top.width}%`, bottom: `${23 + count * 5}%` }} />
          </>
        )}
        <button className="snack-field__drop" aria-label="Tap the playfield to drop a snack" tabIndex={-1} onClick={drop} disabled={round.status !== "playing"} />

        {round.status === "ready" && (
          <div className="game-overlay snack-overlay">
            <div className="snack-mini-cake" aria-hidden="true"><i /><i /><i /></div>
            <h2>Make a little<br />masterpiece.</h2>
            <p>Tap when the cake lines up. The edges that stick out get trimmed away.</p>
            <p className="snack-overlay__hint">Build 12 layers. Perfect drops keep every crumb.</p>
            <button className="primary-button" onClick={start}>Let’s stack</button>
          </div>
        )}
        {round.status === "paused" && (
          <div className="game-overlay snack-overlay" role="dialog" aria-label="Game paused">
            <PixelIcon name="moon" size={42} /><h2>Taking a breather</h2><p>Your cake can wait.</p>
            <button ref={resumeRef} className="primary-button" onClick={resume}>Keep stacking</button>
            <button className="text-button" onClick={onBack}>Leave this round</button>
          </div>
        )}
        {round.status === "done" && (
          <GameResultPanel title={count === STACK_GOAL ? "A towering success!" : count === 0 ? "One more little try?" : "A delicious little tower"} score={score} previousBest={round.previousBest} coinsEarned={getSnackStackReward(count, round.perfects)} zeroRewardMessage="Land a layer to bring home your first coin." detail={count === STACK_GOAL ? `All 12 layers, with ${round.perfects} perfect ${round.perfects === 1 ? "drop" : "drops"}.` : `${count} of 12 layers. Every tower starts with a little practice.`} onReplay={start} onBack={onBack} overlay />
        )}
      </div>

      <p className={`snack-feedback ${round.message.startsWith("Perfect") ? "is-perfect" : ""}`} role="status" aria-live="polite">{round.message}</p>
      <button ref={dropRef} className="primary-button snack-drop" onClick={drop} disabled={round.status !== "playing"}>Drop snack <span>↓</span></button>
      <p className="snack-controls-hint">Tap the cake or press the button. Keyboard: Enter or Space.</p>
    </section>
  );
}
