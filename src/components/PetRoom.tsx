import { useEffect, useMemo, useRef, useState } from "react";
import { PETS, getDialogue } from "../data/pets";
import { careForPet, deriveMood, feedPet, formatPetAge, getFeedAvailability, getRoomPhase, wakePet } from "../lib/gameState";
import type { CareAction, PetSave, SyncStatus } from "../types";
import { PixelIcon } from "./PixelIcon";
import { StatBar } from "./StatBar";
import { dailyFor, DAILY_TASKS, friendshipLevel } from "../lib/keepsakes";
import { playSound } from "../lib/sound";
import "./room-details.css";

interface PetRoomProps {
  save: PetSave;
  syncStatus: SyncStatus;
  onChange: (next: PetSave) => void;
  onGames: () => void;
  onShop: () => void;
  onSettings: () => void;
  onBook: () => void;
}

function RoomDecoration({ itemId }: { itemId: string }) {
  if (itemId === "rose-cushion") return <div className="room-decoration rose-cushion" aria-hidden="true"><PixelIcon name="heart" size={24} /></div>;
  if (itemId === "yarn-ball") return <div className="room-decoration yarn-ball" aria-hidden="true"><PixelIcon name="yarn" size={35} /></div>;
  if (itemId === "moon-mobile") return <div className="room-decoration moon-mobile" aria-hidden="true"><i /><PixelIcon name="moon" size={34} /></div>;
  if (itemId === "starlight-jar") return <div className="room-decoration starlight-jar" aria-hidden="true"><PixelIcon name="sparkle" size={28} /></div>;
  if (itemId === "flower-rug") return null;
  return <div className="heart-lamp" aria-hidden="true"><PixelIcon name="heart" size={28} /></div>;
}

export function PetRoom({ save, syncStatus, onChange, onGames, onShop, onSettings, onBook }: PetRoomProps) {
  const [sheet, setSheet] = useState<"feed" | "care" | null>(null);
  const [dialogueSeed, setDialogueSeed] = useState(() => Date.now());
  const [roomPhase, setRoomPhase] = useState(getRoomPhase);
  const [reaction, setReaction] = useState(0);
  const sheetRef = useRef<HTMLElement>(null);
  const daily = dailyFor(save);
  const rewardsReady = DAILY_TASKS.filter(t => daily.activities.includes(t.id) && !daily.claimed.includes(t.id)).length;
  const friendship = friendshipLevel(save.keepsakes.friendship);
  const mood = deriveMood(save);
  const pet = PETS[save.petType];
  const selectedDecoration = save.selectedDecoration || "heart-lamp";
  const petAge = formatPetAge(save.createdAt);
  const dialogue = useMemo(
    () => getDialogue(save.petType, mood, dialogueSeed, {
      phase: roomPhase,
      selectedDecoration,
      lastInteraction: save.lastInteraction,
    }),
    [save.petType, save.lastInteraction, mood, dialogueSeed, roomPhase, selectedDecoration],
  );

  const syncCopy = syncStatus.phase === "saved"
    ? "Saved to cloud"
    : syncStatus.phase === "saving"
      ? "Saving…"
      : syncStatus.phase === "error"
        ? "Save retry needed"
        : "Saved on this phone";

  useEffect(() => {
    const timer = window.setInterval(() => setRoomPhase(getRoomPhase()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = sheetRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]') ?? []);
    focusable()[0]?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setSheet(null); }
      if (event.key !== "Tab") return;
      const items = focusable(), first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; previous?.focus(); };
  }, [sheet]);

  function react() { setReaction(n => n + 1); setDialogueSeed(Date.now()); playSound("tap"); }

  function care(action: CareAction) {
    onChange(careForPet(save, action));
    react();
    setSheet(null);
  }

  return (
    <main className="game-shell">
      <header className="game-topbar">
        <div className="coin-pill" aria-label={`${save.coins} coins`}><PixelIcon name="coin" size={24} /><strong>{save.coins}</strong></div>
        <div className="room-status"><span>{roomPhase === "day" ? "☀ Day" : "☾ Night"}</span><p className={`sync-state sync-state--${syncStatus.phase}`}>{syncCopy}</p></div>
        <button className="icon-button" onClick={onSettings} aria-label="Open settings">⚙</button>
      </header>

      <section className={`pixel-room palette-${save.keepsakes.theme} time-${roomPhase} mood-${mood}`} aria-label={`${save.petName}'s room during the ${roomPhase}`}>
        <div className="pixel-window" aria-hidden="true"><span /><i /><b /></div>
        <div className="pixel-lamp" aria-hidden="true"><span /><i /></div>
        <div className={`pixel-rug ${selectedDecoration === "flower-rug" ? "pixel-rug--flower" : ""}`} aria-hidden="true" />
        <RoomDecoration itemId={selectedDecoration} />
        <button
          className="pet-stage"
          onClick={() => {
            onChange(save.isSleeping ? wakePet(save) : careForPet(save, "pet"));
            react();
          }}
          aria-label={save.isSleeping ? `Wake ${save.petName}` : `Pet ${save.petName}`}
        >
          <img className="pet-sprite" src={pet.asset} alt={`${pet.label} named ${save.petName}`} />
          {mood === "sleeping" && <span className="sleep-pixels" aria-hidden="true">z z</span>}
          {reaction > 0 && <span key={reaction} className="pet-reaction" aria-hidden="true"><PixelIcon name="heart" size={24} /><PixelIcon name="sparkle" size={17} /></span>}
        </button>
      </section>

      <section className="pet-panel">
        <div className="speech-bubble">
          <div><h1>{save.petName}</h1><span>{pet.label} · {petAge}</span></div>
          <p>“{dialogue}”</p>
        </div>

        <div className="stats-grid">
          <StatBar label="Full" value={save.stats.fullness} tone="#c98293" />
          <StatBar label="Happy" value={save.stats.happiness} tone="#d5a15d" />
          <StatBar label="Energy" value={save.stats.energy} tone="#8f87b8" />
          <StatBar label="Clean" value={save.stats.cleanliness} tone="#7d9a8a" />
        </div>

        <nav className="action-dock" aria-label="Care actions">
          <button onClick={() => setSheet("feed")}><PixelIcon name="apple" /><span>Feed</span></button>
          <button onClick={() => setSheet("care")}><PixelIcon name="heart" /><span>Care</span></button>
          <button className="action-dock__play" onClick={onGames}><PixelIcon name="controller" /><span>Play</span></button>
          <button onClick={onShop}><PixelIcon name="shop" /><span>Shop</span></button>
        </nav>
        <button className="keepsake-link" onClick={onBook}>
          <span className="tiny-book" aria-hidden="true"><PixelIcon name="heart" size={18} /></span>
          <span><strong>Our keepsakes</strong><small>{rewardsReady ? `${rewardsReady} little reward${rewardsReady > 1 ? "s" : ""} to collect` : friendship.name}</small></span>
          <b aria-hidden="true">{rewardsReady ? <span className="reward-dot" /> : "↗"}</b>
        </button>
      </section>

      {sheet && (
        <div className="sheet-backdrop" onClick={() => setSheet(null)}>
          <section ref={sheetRef} className="bottom-sheet" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-label={sheet === "feed" ? "Choose food" : "Care for your friend"}>
            <div className="sheet-handle" />
            <div className="sheet-heading"><h2>{sheet === "feed" ? "Choose a snack" : `Care for ${save.petName}`}</h2><button onClick={() => setSheet(null)} aria-label="Close">×</button></div>
            {sheet === "feed" ? (
              <div className="item-list">
                {pet.foods.map((item) => {
                  const availability = getFeedAvailability(save, item);
                  const status = availability.reason === "too-full"
                    ? "Too full for this"
                    : availability.reason === "not-enough-coins"
                      ? `Need ${item.cost} coins`
                      : `+${Math.round(availability.fullnessGain)} Full · +${Math.round(availability.happinessGain)} Happy`;
                  return (
                    <button
                      key={item.id}
                      disabled={!availability.allowed}
                      onClick={() => { onChange(feedPet(save, item)); react(); setSheet(null); }}
                    >
                      <PixelIcon name={item.icon} size={38} />
                      <span><strong>{item.name}</strong><small>{status}</small></span>
                      <b>{item.cost} coins</b>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="item-list">
                <button onClick={() => care("pet")}><PixelIcon name="heart" size={38} /><span><strong>Gentle pets</strong><small>More happiness</small></span></button>
                <button onClick={() => care("wash")}><PixelIcon name="star" size={38} /><span><strong>Freshen up</strong><small>More cleanliness</small></span></button>
                <button onClick={() => care("nap")}><PixelIcon name="moon" size={38} /><span><strong>Cosy nap</strong><small>More energy</small></span></button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
