import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import '../styles/ShopPage.css';

const PRODUCTS = [
  { id: 1, name: 'Cue - Pro Series', price: 450, description: 'Professional-grade cue for serious players' },
  { id: 2, name: 'Pool Balls Set', price: 280, description: 'Complete regulation set of billiard balls' },
  { id: 3, name: 'Chalk Cube', price: 35, description: 'Premium quality chalk for cue tips' },
  { id: 4, name: 'Bridge Stick', price: 120, description: 'Mechanical bridge for difficult shots' },
  { id: 5, name: 'Cue Rack (8-slot)', price: 380, description: 'Wall-mounted storage for your collection' },
  { id: 6, name: 'Cue Case', price: 550, description: 'Protective aluminium travel case' },
  { id: 7, name: 'Table Brush', price: 95, description: 'Keep your table clean and game-ready' },
  { id: 8, name: 'Score Keeper', price: 150, description: 'Digital electronic scorer' },
];

const rand = (amount) => `R${amount.toFixed(2)}`;

export default function ShopPage() {
  const { addNotification } = useNotification();
  const [cart, setCart] = useState([]);

  const setQuantity = (product, quantity) => {
    setCart((current) => {
      if (quantity <= 0) return current.filter((item) => item.id !== product.id);
      if (current.some((item) => item.id === product.id)) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity } : item));
      }
      return [...current, { ...product, quantity }];
    });
  };

  const quantityOf = (productId) => cart.find((item) => item.id === productId)?.quantity || 0;
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const orderSummary = () =>
    [
      'UCT Supa Pool order',
      ...cart.map((item) => `${item.quantity} x ${item.name} @ ${rand(item.price)} = ${rand(item.price * item.quantity)}`),
      `Total: ${rand(total)}`,
    ].join('\n');

  const copyOrder = async () => {
    try {
      await navigator.clipboard.writeText(orderSummary());
      addNotification({ type: 'success', title: 'Order list copied', message: 'Paste it in a message to the committee', duration: 3000 });
    } catch {
      addNotification({ type: 'error', title: "Couldn't copy", message: 'Your browser blocked clipboard access' });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Shop</h1>
        <p className="page-subtitle">Equipment and accessories for the serious pool player</p>
      </div>

      <div className="shop-layout">
        <div className="card-grid shop-products">
          {PRODUCTS.map((product) => (
            <article key={product.id} className="item-card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="flex-between row-actions">
                <span className="shop-price">{rand(product.price)}</span>
                <button className="btn-small" onClick={() => setQuantity(product, quantityOf(product.id) + 1)}>
                  {quantityOf(product.id) ? `Add another (${quantityOf(product.id)})` : 'Add to list'}
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="panel shop-cart">
          <h2 className="panel-title">Your list ({count})</h2>
          {cart.length === 0 ? (
            <p className="muted">Add items to build an order list.</p>
          ) : (
            <>
              <div className="list">
                {cart.map((item) => (
                  <div className="shop-cart-item" key={item.id}>
                    <div className="flex-between">
                      <span className="list-row-title">{item.name}</span>
                      <span>{rand(item.price * item.quantity)}</span>
                    </div>
                    <div className="shop-qty">
                      <button className="btn-outline btn-small" onClick={() => setQuantity(item, item.quantity - 1)} aria-label={`One fewer ${item.name}`}>−</button>
                      <span>{item.quantity}</span>
                      <button className="btn-outline btn-small" onClick={() => setQuantity(item, item.quantity + 1)} aria-label={`One more ${item.name}`}>+</button>
                      <button className="link-btn" onClick={() => setQuantity(item, 0)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="shop-total flex-between">
                <span>Total</span>
                <span>{rand(total)}</span>
              </div>
              <button className="btn-outline" style={{ width: '100%' }} onClick={copyOrder}>Copy order list</button>
            </>
          )}
          <div className="notice" style={{ marginTop: '1rem' }}>
            Online checkout isn&apos;t available. To order, send your list to the UCT Supa Pool committee and they&apos;ll
            arrange payment and collection with you.
          </div>
        </aside>
      </div>
    </div>
  );
}
