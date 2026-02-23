import { useState } from 'react';
import '../styles/PageContent.css';

export default function ShopPage() {
  const [cart, setCart] = useState([]);

  const products = [
    { id: 1, name: 'Cue - Pro Series', price: 450, emoji: '🎯', description: 'Professional-grade cue for serious players' },
    { id: 2, name: 'Pool Balls Set', price: 280, emoji: '🔮', description: 'Complete regulation set of billiard balls' },
    { id: 3, name: 'Chalk Cube', price: 35, emoji: '⚪', description: 'Premium quality chalk for cue tips' },
    { id: 4, name: 'Bridge Stick', price: 120, emoji: '🌉', description: 'Mechanical bridge for difficult shots' },
    { id: 5, name: 'Cue Rack (8-slot)', price: 380, emoji: '📦', description: 'Wall-mounted storage for your collection' },
    { id: 6, name: 'Cue Case', price: 550, emoji: '💼', description: 'Protective aluminum travel case' },
    { id: 7, name: 'Table Brush', price: 95, emoji: '🧹', description: 'Keep your table clean and game-ready' },
    { id: 8, name: 'Score Keeper', price: 150, emoji: '📊', description: 'Digital electronic scorer' },
  ];

  const handleAddToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🛍️ Shop</h1>
        <p className="page-subtitle">Equipment and accessories for the serious pool player</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', marginBottom: '2rem' }}>
        {/* Products Grid */}
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1.5rem'
          }}>
            {products.map(product => (
              <div key={product.id} className="content-card" style={{
                background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '0.5rem',
                  textAlign: 'center'
                }}>
                  {product.emoji}
                </div>
                <h3 style={{ color: '#646cff', margin: '0.5rem 0', fontSize: '1rem' }}>
                  {product.name}
                </h3>
                <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '0.5rem 0 1rem 0', flex: 1 }}>
                  {product.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#646cff', fontWeight: '700', fontSize: '1.1rem' }}>
                    R{product.price}
                  </span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    style={{
                      padding: '0.6rem 1rem',
                      background: 'linear-gradient(135deg, #646cff 0%, #535bf2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shopping Cart Sidebar */}
        <div className="content-card" style={{
          background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
          padding: '1.5rem',
          height: 'fit-content',
          position: 'sticky',
          top: '100px'
        }}>
          <h2 style={{ color: '#646cff', marginTop: 0, marginBottom: '1rem' }}>
            🛒 Cart ({cartCount})
          </h2>

          {cart.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#888',
              padding: '2rem 0'
            }}>
              <p style={{ marginTop: 0 }}>Your cart is empty</p>
              <p style={{ fontSize: '3rem', margin: '1rem 0' }}>📭</p>
            </div>
          ) : (
            <>
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
                {cart.map(item => (
                  <div key={item.id} style={{
                    borderBottom: '1px solid #404040',
                    paddingBottom: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.95rem' }}>
                        {item.name}
                      </span>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          fontSize: '1.1rem'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: '#aaa',
                      fontSize: '0.9rem'
                    }}>
                      <span>R{item.price}</span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          style={{
                            background: '#404040',
                            border: 'none',
                            color: '#fff',
                            width: '24px',
                            height: '24px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          −
                        </button>
                        <span style={{ width: '24px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          style={{
                            background: '#404040',
                            border: 'none',
                            color: '#fff',
                            width: '24px',
                            height: '24px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right',
                      color: '#646cff',
                      marginTop: '0.5rem',
                      fontWeight: '600'
                    }}>
                      R{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                borderTop: '2px solid #404040',
                paddingTop: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: '#646cff'
                }}>
                  <span>Total:</span>
                  <span>R{cartTotal.toFixed(2)}</span>
                </div>
                <button style={{
                  width: '100%',
                  padding: '0.9rem',
                  background: 'linear-gradient(135deg, #646cff 0%, #535bf2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '1rem'
                }}>
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
