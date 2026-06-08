import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatMoney = (value) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const loadData = async () => {
    try {
      const [salesRes, prodRes] = await Promise.all([
        api.get('/ventas'),
        api.get('/productos'),
      ]);
      setSales(salesRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addToCart = () => {
    if (!selectedProductId) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const existing = cart.find((item) => item.producto_id === selectedProductId);
    if (existing) {
      if (existing.cantidad + quantity > product.stock) {
        setError(`Stock insuficiente. Disponible: ${product.stock}`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.producto_id === selectedProductId
            ? { ...item, cantidad: item.cantidad + quantity }
            : item
        )
      );
    } else {
      if (quantity > product.stock) {
        setError(`Stock insuficiente. Disponible: ${product.stock}`);
        return;
      }
      setCart([...cart, { producto_id: product.id, nombre: product.nombre, precio: product.precio, cantidad: quantity }]);
    }
    setError('');
    setSelectedProductId('');
    setQuantity(1);
  };

  const removeFromCart = (productoId) => {
    setCart(cart.filter((item) => item.producto_id !== productoId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const handleDownloadTicket = async (saleId) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${baseUrl}/ventas/${saleId}/ticket`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al descargar ticket');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setError('Error al generar ticket');
    }
  };

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      setError('Agrega al menos un producto');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post('/ventas', {
        items: cart.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
        })),
      });
      setCart([]);
      setCreating(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar venta');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Nueva Venta</h2>
            <p className="text-sm text-slate-500 mt-1">Agregar productos y registrar venta</p>
          </div>
          <button
            onClick={() => { setCreating(false); setCart([]); setError(''); }}
            className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Agregar Producto</h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Producto</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => { setSelectedProductId(e.target.value); setError(''); }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Selecciona un producto...</option>
                    {products
                      .filter((p) => p.stock > 0)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} — {formatMoney(p.precio)} (Stock: {p.stock})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <button
                  onClick={addToCart}
                  disabled={!selectedProductId}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  + Agregar
                </button>
              </div>

              {error && (
                <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
                  {error}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase">Producto</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase text-center">Cant</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase text-right">Precio</th>
                      <th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase text-right">Subtotal</th>
                      <th className="px-5 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {cart.map((item) => (
                      <tr key={item.producto_id}>
                        <td className="px-5 py-2.5 text-slate-800">{item.nombre}</td>
                        <td className="px-5 py-2.5 text-center text-slate-600">{item.cantidad}</td>
                        <td className="px-5 py-2.5 text-right text-slate-600">{formatMoney(item.precio)}</td>
                        <td className="px-5 py-2.5 text-right text-slate-800 font-medium">
                          {formatMoney(item.precio * item.cantidad)}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <button
                            onClick={() => removeFromCart(item.producto_id)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-24">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Resumen</h3>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-500">Productos</span>
                <span className="text-slate-700">{cart.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-500">Items</span>
                <span className="text-slate-700">{cart.reduce((s, i) => s + i.cantidad, 0)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Total</span>
                <span className="text-lg font-bold text-slate-800">{formatMoney(cartTotal)}</span>
              </div>
              <button
                onClick={handleCreateSale}
                disabled={cart.length === 0 || saving}
                className="w-full mt-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
              >
                {saving ? 'Registrando...' : 'Registrar Venta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Ventas</h2>
          <p className="text-sm text-slate-500 mt-1">Historial de ventas registradas</p>
        </div>
        {user?.rol !== 'revisor' && (
          <button
            onClick={() => setCreating(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Nueva Venta
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Vendedor</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Total</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <span className="text-3xl block mb-2">💰</span>
                    <span className="text-sm text-slate-400">No hay ventas registradas</span>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-xs text-slate-500 font-mono">
                      {sale.id.substring(0, 8)}...
                    </td>
                    <td className="px-5 py-3 text-slate-700">{formatDate(sale.fecha)}</td>
                    <td className="px-5 py-3 text-slate-700">{sale.vendedor_nombre}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-800">
                      {formatMoney(sale.total)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDownloadTicket(sale.id)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline"
                      >
                        Ticket
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
