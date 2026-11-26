// Shopping bag kept in localStorage. Checkout sends the whole bag to Shopify's
// cart permalink (/cart/<variantId>:<qty>,...), which opens Shopify checkout directly.
const STORE = 'https://mysterieuxbrand.com';
const KEY = 'mysterieux-bag';

const Bag = {
  items() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } },
  save(items) { localStorage.setItem(KEY, JSON.stringify(items)); render(); },
  add(item, qty = 1) {
    const items = this.items();
    const existing = items.find(i => i.id === item.id);
    if (existing) existing.qty = Math.min(existing.qty + qty, 10);
    else items.push({ ...item, qty });
    this.save(items);
  },
  setQty(id, qty) {
    this.save(this.items().map(i => i.id === id ? { ...i, qty } : i).filter(i => i.qty > 0));
  },
  checkoutUrl(items = this.items()) {
    return `${STORE}/cart/${items.map(i => `${i.id}:${i.qty}`).join(',')}`;
  },
};

const money = n => `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`;

document.body.insertAdjacentHTML('beforeend', `
  <div class="bag-scrim" data-bag-close hidden></div>
  <aside class="bag" aria-label="Shopping bag" aria-hidden="true">
    <header><h2>Your bag</h2><button type="button" data-bag-close aria-label="Close bag">✕</button></header>
    <ul class="bag-items"></ul>
    <p class="bag-empty">Your bag is empty.</p>
    <footer>
      <div class="bag-total"><span>Subtotal</span><b></b></div>
      <p class="bag-note">Shipping &amp; taxes calculated at checkout. Free shipping on orders over $100.</p>
      <button type="button" class="btn bag-checkout">Checkout</button>
    </footer>
  </aside>`);

const drawer = document.querySelector('.bag');
const scrim = document.querySelector('.bag-scrim');

function toggleBag(open) {
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  scrim.hidden = !open;
}

function render() {
  const items = Bag.items();
  const count = items.reduce((n, i) => n + i.qty, 0);
  document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = count; el.hidden = !count; });
  drawer.querySelector('.bag-empty').hidden = items.length > 0;
  drawer.querySelector('footer').hidden = !items.length;
  drawer.querySelector('.bag-total b').textContent = money(items.reduce((s, i) => s + i.price * i.qty, 0));
  drawer.querySelector('.bag-items').innerHTML = items.map(i => `
    <li>
      <a href="${i.url}"><img src="${i.img}" alt=""></a>
      <div>
        <a href="${i.url}" class="t">${i.title}</a>
        <span class="v">${i.variant}</span>
        <div class="q">
          <button type="button" data-qty="${i.id}" data-d="-1" aria-label="Decrease quantity">−</button>
          <span>${i.qty}</span>
          <button type="button" data-qty="${i.id}" data-d="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <b>${money(i.price * i.qty)}</b>
    </li>`).join('');
}

document.addEventListener('click', e => {
  if (e.target.closest('[data-cart-open]')) { e.preventDefault(); toggleBag(true); }
  if (e.target.closest('[data-bag-close]')) toggleBag(false);
  const q = e.target.closest('[data-qty]');
  if (q) {
    const id = Number(q.dataset.qty);
    const item = Bag.items().find(i => i.id === id);
    if (item) Bag.setQty(id, Math.min(item.qty + Number(q.dataset.d), 10));
  }
  if (e.target.closest('.bag-checkout')) location.href = Bag.checkoutUrl();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleBag(false); });
window.addEventListener('storage', render);

render();
window.Bag = Bag;
window.openBag = () => toggleBag(true);
