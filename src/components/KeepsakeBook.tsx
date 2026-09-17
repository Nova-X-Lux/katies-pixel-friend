import { useEffect, useState } from "react";
import { PETS } from "../data/pets";
import { claimDailyTask, dailyFor, DAILY_TASKS, friendshipLevel, openDailyParcel, ROOM_THEMES, chooseRoomTheme, STAMPS } from "../lib/keepsakes";
import type { PetSave } from "../types";
import { PixelIcon } from "./PixelIcon";
import { playSound } from "../lib/sound";
import "./keepsake-book.css";

export function KeepsakeBook({ save, onChange, onClose, onPlay }: {
  save: PetSave; onChange: (s: PetSave) => void; onClose: () => void; onPlay: () => void;
}) {
  const [page, setPage] = useState<"today" | "pages" | "room">("today");
  const [now, setNow] = useState(() => new Date());
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(save.keepsakes.theme);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30_000); return () => window.clearInterval(timer); }, []);
  const daily = dailyFor(save, now);
  const friendship = friendshipLevel(save.keepsakes.friendship);
  const collected = STAMPS.filter(s => save.keepsakes.stamps[s.id]);
  const theme = ROOM_THEMES.find(t => t.id === preview) ?? ROOM_THEMES[0];
  const owned = save.keepsakes.themes.includes(theme.id);
  const favourite = PETS[save.petType].foods.filter(f => save.keepsakes.foodCounts[f.id]).sort((a, b) => save.keepsakes.foodCounts[b.id] - save.keepsakes.foodCounts[a.id])[0];

  function apply(next: PetSave, copy: string) {
    if (next === save) return;
    onChange(next); setMessage(copy); playSound("reward");
  }

  return <main className="keepsake-shell">
    <header className="screen-heading">
      <button className="back-button" onClick={onClose}>‹ Room</button>
      <div><p>The little things</p><h1>Our keepsakes</h1></div>
      <span className="shop-balance" aria-label={`${save.coins} coins`}><PixelIcon name="coin" size={22} />{save.coins}</span>
    </header>
    <nav className="book-tabs" aria-label="Keepsake pages">
      {(["today", "pages", "room"] as const).map(id => <button key={id} aria-current={page === id ? "page" : undefined} onClick={() => { setPage(id); setMessage(""); }}>{id === "today" ? "Today" : id === "pages" ? "Scrapbook" : "Room colours"}</button>)}
    </nav>
    <section className="book-paper" aria-label={page === "today" ? "Today's activities" : page === "pages" ? "Your scrapbook" : "Room colour collection"}>
      {page === "today" && <>
        <div className="book-date"><span>{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</span><span>01 / 03</span></div>
        <h2>A little time together.</h2>
        <p className="book-intro">Three small things to do with {save.petName}. Pop in whenever you feel like it.</p>
        <div className="friendship-note">
          <PixelIcon name="heart" size={30} /><div><strong>{friendship.name}</strong><span>{friendship.hearts} hearts{friendship.next ? ` · next milestone at ${friendship.next}` : " · right where you belong"}</span>
          <div className="friendship-track" role="progressbar" aria-label="Friendship progress" aria-valuenow={friendship.progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${friendship.progress}%` }} /></div></div>
        </div>
        <p className="book-caption">Different kinds of care earn 5 hearts each day. Hearts stay with you.</p>
        <div className="daily-list">
          {DAILY_TASKS.map(task => {
            const done = daily.activities.includes(task.id), claimed = daily.claimed.includes(task.id);
            return <article key={task.id} className={`daily-task ${claimed ? "is-claimed" : ""}`}>
              <span className="task-stamp"><PixelIcon name={task.icon} size={26} /></span>
              <div><h3>{task.title}</h3><p>{task.detail}</p></div>
              {claimed ? <span className="claimed-mark" aria-label={`${task.title}: collected`}>✓</span> : done ? <button className="book-claim" onClick={() => apply(claimDailyTask(save, task.id), "+5 coins tucked away.")} aria-label={`Collect 5 coins for ${task.title}`}>+5 <PixelIcon name="coin" size={16} /></button> : <button className="book-go" onClick={task.id === "play" ? onPlay : onClose} aria-label={`Go to ${task.title}`}>Go <span aria-hidden="true">↗</span></button>}
            </article>;
          })}
        </div>
        <div className="parcel-note">
          <div className={`pixel-parcel ${daily.parcelOpened ? "is-open" : ""}`} aria-hidden="true"><i /><b /></div>
          <div><h3>{daily.parcelOpened ? "All wrapped up." : "A little extra"}</h3><p>{daily.parcelOpened ? "Your 10 bonus coins are in your purse." : "Collect all three rewards to open today’s parcel."}</p>
          {!daily.parcelOpened && <button className="book-claim" disabled={!DAILY_TASKS.every(t => daily.claimed.includes(t.id))} onClick={() => apply(openDailyParcel(save), "Parcel opened! +10 coins.")}>Open parcel · 10 coins</button>}</div>
        </div>
        <p className="book-footnote">Fresh activities tomorrow. No streak to keep up with.</p>
      </>}
      {page === "pages" && <>
        <div className="book-date"><span>{save.petName}’s collection</span><span>02 / 03</span></div>
        <h2>Good days, kept.</h2><p className="book-intro">Small firsts and favourite moments, saved as you go.</p>
        <div className="pet-polaroid"><span className="paper-tape" /><img src={PETS[save.petType].asset} alt={save.petName} /><strong>{save.petName}</strong><span>Home since {new Date(save.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span></div>
        <dl className="book-facts"><div><dt>Games together</dt><dd>{save.keepsakes.gamesPlayed}</dd></div><div><dt>Favourite snack</dt><dd>{favourite?.name ?? "Still taste-testing"}</dd></div></dl>
        <div className="collection-heading"><h3>Little milestones</h3><span>{collected.length} / {STAMPS.length}</span></div>
        <div className="stamp-collection">{STAMPS.map(stamp => {
          const date = save.keepsakes.stamps[stamp.id];
          return <article key={stamp.id} className={`keepsake-stamp ${date ? "is-earned" : ""}`}><div className="stamp-art"><PixelIcon name={stamp.icon} size={40} /></div><h3>{stamp.title}</h3><p>{date ? new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : stamp.hint}</p></article>;
        })}</div>
      </>}
      {page === "room" && <>
        <div className="book-date"><span>A place of your own</span><span>03 / 03</span></div>
        <h2>A change of scenery.</h2><p className="book-intro">Pick a palette. Once it’s yours, you can swap whenever you like.</p>
        <div className="palette-preview" style={{ background: theme.wall }} aria-label={`${theme.name} preview`}><span className="preview-window" /><span className="preview-floor" style={{ background: theme.floor }} /><img src={PETS[save.petType].asset} alt="" /><span className="preview-label">{theme.name}</span></div>
        <div className="palette-swatches" aria-label="Preview a room palette">{ROOM_THEMES.map(t => <button key={t.id} aria-pressed={preview === t.id} onClick={() => { setPreview(t.id); setMessage(""); }}><i style={{ background: `linear-gradient(${t.wall} 60%, ${t.floor} 60%)` }} /><span>{t.name}</span></button>)}</div>
        <div className="palette-description"><h3>{theme.name}</h3><p>{theme.detail}</p><button className="primary-button" disabled={save.keepsakes.theme === theme.id || (!owned && save.coins < theme.cost)} onClick={() => apply(chooseRoomTheme(save, theme.id), owned ? "A fresh look for the room." : `${theme.name} is yours to keep.`)}>{save.keepsakes.theme === theme.id ? "In your room" : owned ? "Use this palette" : save.coins < theme.cost ? `${theme.cost - save.coins} more coins to go` : `Keep this palette · ${theme.cost} coins`}</button></div>
      </>}
      <p className="book-message" role="status" aria-live="polite">{message}</p>
    </section>
  </main>;
}
