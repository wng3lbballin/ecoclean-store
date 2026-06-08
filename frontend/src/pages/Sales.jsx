import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatMoney = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const estadoBadge = {
  pagado: 'bg-emerald-100 text-emerald-700',
  pendiente: 'bg-amber-100 text-amber-700',
  cancelado: 'bg-red-100 text-red-700',
};

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [estado, setEstado] = useState('pagado');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const loadData = async () => {
    try { const [sRes, pRes, cRes] = await Promise.all([api.get('/ventas'), api.get('/productos'), api.get('/clientes')]); setSales(sRes.data); setProducts(pRes.data); setClients(cRes.data); } catch { setError('Error al cargar'); } setLoading(false);
  };
  useEffect(() => { loadData(); }, []);

  const addToCart = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;
    const existing = cart.find((i) => i.producto_id === selectedProductId);
    if (existing) { if (existing.cantidad + quantity > prod.stock) { setError(`Stock insuficiente. Disponible: ${prod.stock}`); return; } setCart(cart.map((i) => i.producto_id === selectedProductId ? { ...i, cantidad: i.cantidad + quantity } : i)); }
    else { if (quantity > prod.stock) { setError(`Stock insuficiente. Disponible: ${prod.stock}`); return; } setCart([...cart, { producto_id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: quantity }]); }
    setError(''); setSelectedProductId(''); setQuantity(1);
  };

  const removeFromCart = (pid) => setCart(cart.filter((i) => i.producto_id !== pid));
  const cartTotal = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const handleCreateSale = async () => {
    if (cart.length === 0) { setError('Agrega al menos un producto'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/ventas', { items: cart.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })), cliente_id: clienteId || null, estado });
      setCart([]); setCreating(false); setClienteId(''); setEstado('pagado'); loadData();
    } catch (err) { setError(err.response?.data?.error || 'Error al registrar venta'); } finally { setSaving(false); }
  };

  const handleDownloadTicket = async (saleId) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = window.__API_URL__ || process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${baseUrl}/ventas/${saleId}/ticket`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob(); window.open(URL.createObjectURL(blob), '_blank');
    } catch { setError('Error al generar ticket'); }
  };

  const handleEstadoChange = async (saleId, newEstado) => {
    try { await api.patch(`/ventas/${saleId}/estado`, { estado: newEstado }); loadData(); } catch { setError('Error al actualizar estado'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div></div>;

  if (creating) return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-800">Nueva Factura</h2><p className="text-sm text-slate-500 mt-1">Registrar venta</p></div><button onClick={() => { setCreating(false); setCart([]); setError(''); }} className="text-sm font-medium text-slate-600 hover:text-slate-800">Cancelar</button></div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Cliente</label><select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="">Venta al público</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Estado</label><select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="pagado">Pagado</option><option value="pendiente">Pendiente</option></select></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Agregar Producto</h3>
            <div className="flex gap-3 items-end"><div className="flex-1"><label className="block text-xs text-slate-600 mb-1">Producto</label><select value={selectedProductId} onChange={(e) => { setSelectedProductId(e.target.value); setError(''); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="">Selecciona...</option>{products.filter((p) => p.stock > 0).map((p) => <option key={p.id} value={p.id}>{p.nombre} — {formatMoney(p.precio)} ({p.stock})</option>)}</select></div><div className="w-24"><label className="block text-xs text-slate-600 mb-1">Cant</label><input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div><button onClick={addToCart} disabled={!selectedProductId} className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap">+ Agregar</button></div>
            {error && <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">{error}</div>}
          </div>
          {cart.length > 0 && (<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left"><th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase">Producto</th><th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase text-center">Cant</th><th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase text-right">Precio</th><th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase text-right">Subtotal</th><th></th></tr></thead><tbody className="divide-y divide-slate-50">{cart.map((item) => (<tr key={item.producto_id}><td className="px-5 py-2.5 text-slate-800">{item.nombre}</td><td className="px-5 py-2.5 text-center">{item.cantidad}</td><td className="px-5 py-2.5 text-right">{formatMoney(item.precio)}</td><td className="px-5 py-2.5 text-right font-medium">{formatMoney(item.precio * item.cantidad)}</td><td className="px-5 py-2.5 text-right"><button onClick={() => removeFromCart(item.producto_id)} className="text-slate-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></td></tr>))}</tbody></table></div>)}
        </div>
        <div><div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-24"><h3 className="text-sm font-semibold text-slate-700 mb-3">Resumen</h3><div className="flex justify-between text-sm mb-1"><span className="text-slate-500">Productos</span><span>{cart.length}</span></div><div className="flex justify-between text-sm mb-1"><span className="text-slate-500">Items</span><span>{cart.reduce((s, i) => s + i.cantidad, 0)}</span></div><div className="flex justify-between pt-3 mt-3 border-t border-slate-100"><span className="text-sm font-semibold">Total</span><span className="text-lg font-bold text-slate-800">{formatMoney(cartTotal)}</span></div><button onClick={handleCreateSale} disabled={cart.length === 0 || saving} className="w-full mt-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm">{saving ? 'Registrando...' : 'Registrar Factura'}</button></div></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-800">Facturación</h2><p className="text-sm text-slate-500 mt-1">Ventas y facturas</p></div>{user?.rol !== 'revisor' && <button onClick={() => setCreating(true)} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">+ Nueva Factura</button>}</div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left"><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Factura</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Vendedor</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Total</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Estado</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{sales.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center"><span className="text-3xl block mb-2">💰</span><span className="text-sm text-slate-400">No hay facturas registradas</span></td></tr> : sales.map((sale) => (<tr key={sale.id} className="hover:bg-slate-50/50"><td className="px-5 py-3 text-xs text-primary-600 font-mono font-medium">{sale.numero_factura || sale.id.substring(0, 8)}</td><td className="px-5 py-3 text-slate-700">{formatDate(sale.fecha)}</td><td className="px-5 py-3 text-slate-700">{sale.cliente_nombre || 'Público'}</td><td className="px-5 py-3 text-slate-700">{sale.vendedor_nombre}</td><td className="px-5 py-3 text-right font-medium text-slate-800">{formatMoney(sale.total)}</td><td className="px-5 py-3 text-center">{user?.rol !== 'revisor' ? <select value={sale.estado} onChange={(e) => handleEstadoChange(sale.id, e.target.value)} className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 ${estadoBadge[sale.estado] || 'bg-slate-100'}`}><option value="pagado">Pagado</option><option value="pendiente">Pendiente</option><option value="cancelado">Cancelado</option></select> : <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge[sale.estado] || 'bg-slate-100'}`}>{sale.estado}</span>}</td><td className="px-5 py-3 text-right"><button onClick={() => handleDownloadTicket(sale.id)} className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline">Ticket</button></td></tr>))}</tbody></table></div></div>
    </div>
  );
}
