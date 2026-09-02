import { SHOP_ITEMS } from "../data/shop";
import { buyShopItem, selectShopItem } from "../lib/gameState";
import type { PetSave } from "../types";
import { PixelIcon } from "./PixelIcon";

export function ShopPanel({
  save,
  onChange,
  onClose,
}: {
  save: PetSave;
  onChange: (next: PetSave) => void;
  onClose: () => void;
}) {
  const owned = save.unlockedDecorations ?? ["heart-lamp"];

  return (
    <main className="shop-shell">
      <header className="screen-heading">
        <button onClick={onClose} className="back-button">‹ Room</button>
        <div><p>Spend your stars</p><h1>Cosy Shop</h1></div>
        <span className="shop-balance"><PixelIcon name="star" size={18} /> {save.coins}</span>
      </header>

      <section className="shop-intro">
        <PixelIcon name="shop" size={44} />
        <div><strong>Little comforts</strong><p>Buy them once, then swap the room whenever you like.</p></div>
      </section>

      <div className="shop-grid">
        {SHOP_ITEMS.map((item) => {
          const isOwned = owned.includes(item.id);
          const isSelected = save.selectedDecoration === item.id;
          const canBuy = save.coins >= item.cost;
          return (
            <article className={`shop-card ${isSelected ? "is-selected" : ""}`} key={item.id}>
              <div className={`shop-card__art shop-card__art--${item.id}`}>
                <PixelIcon name={item.icon} size={48} />
                {isSelected && <span>In room</span>}
              </div>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <button
                disabled={isSelected || (!isOwned && !canBuy)}
                onClick={() => onChange(isOwned ? selectShopItem(save, item.id) : buyShopItem(save, item))}
              >
                {isSelected ? "Placed" : isOwned ? "Place it" : canBuy ? `${item.cost} ★` : `Need ${item.cost} ★`}
              </button>
            </article>
          );
        })}
      </div>
    </main>
  );
}
