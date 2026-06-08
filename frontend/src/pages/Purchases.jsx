import { useState, useEffect } from 'react';
import api from '../services/api';

const formatMoney = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [proveedorId, setProveedorId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const [pRes, sRes, prRes] = await Promise.all([api.get('/compras'), api.get('/proveedores'), api.get('/productos')]); setPurchases(pRes.data); setSuppliers(sRes.data); setProducts(prRes.data); } catch { setError('Error al cargar'); } setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addToCart = () => {
    if (!selectedProduct || !price || parseFloat(price) <= 0) { setError('Selecciona producto y precio válido'); return; }
    const prod = products.find((p) => p.id === selectedProduct);
    setCart([...cart, { producto_id: prod.id, nombre: prod.nombre, precio_unitario: parseFloat(price), cantidad: quantity }]);
    setSelectedProduct(''); setQuantity(1); setPrice(''); setError('');
  };

  const removeFromCart = (idx) => setCart(cart.filter((_, i) => i !== idx));
  const cartTotal = cart.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

  const handleCreate = async () => {
    if (!proveedorId) { setError('Selecciona un proveedor'); return; }
    if (cart.length === 0) { setError('Agrega al menos un producto'); return; }
    setSaving(true); setError('');
    try { await api.post('/compras', { proveedor_id: proveedorId, items: cart.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad, precio_unitario: i.precio_unitario })) }); setCart([]); setCreating(false); load(); }
    catch (err) { setError(err.response?.data?.error || 'Error al registrar compra'); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div></div>;

  if (creating) return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-800">Nueva Compra</h2><p className="text-sm text-slate-500 mt-1">Registrar compra a proveedor</p></div><button onClick={() => { setCreating(false); setCart([]); setError(''); }} className="text-sm font-medium text-slate-600 hover:text-slate-800">Cancelar</button></div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Proveedor</label>
            <select value={proveedorId} onChange={(e) => { setProveedorId(e.target.value); setError(''); }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Selecciona un proveedor...</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Agregar Producto</h3>
            <div className="grid grid-cols-4 gap-2 items-end">
              <div className="col-span-2"><label className="block text-xs text-slate-600 mb-1">Producto</label><select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="">Selecciona...</option>{products.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
              <div><label className="block text-xs text-slate-600 mb-1">Cant.</label><input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
              <div><label className="block text-xs text-slate-600 mb-1">Precio</label><input type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            </div>
            <button onClick={addToCart} disabled={!selectedProduct || !price} className="mt-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg">+ Agregar</button>
            {error && <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">{error}</div>}
          </div>
          {cart.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left"><th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase">Producto</th><th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase text-center">Cant</th><th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase text-right">Precio</th><th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase text-right">Subtotal</th><th></th></tr></thead><tbody className="divide-y divide-slate-50">{cart.map((item, idx) => (<tr key={idx}><td className="px-5 py-2.5 text-slate-800">{item.nombre}</td><td className="px-5 py-2.5 text-center">{item.cantidad}</td><td className="px-5 py-2.5 text-right">{formatMoney(item.precio_unitario)}</td><td className="px-5 py-2.5 text-right font-medium">{formatMoney(item.precio_unitario * item.cantidad)}</td><td className="px-5 py-2.5 text-right"><button onClick={() => removeFromCart(idx)} className="text-slate-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></td></tr>))}</tbody></table></div>
          )}
        </div>
        <div><div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-24"><h3 className="text-sm font-semibold text-slate-700 mb-3">Resumen</h3><div className="flex justify-between text-sm mb-1"><span className="text-slate-500">Productos</span><span>{cart.length}</span></div><div className="flex justify-between text-sm mb-1"><span className="text-slate-500">Items</span><span>{cart.reduce((s, i) => s + i.cantidad, 0)}</span></div><div className="flex justify-between pt-3 mt-3 border-t border-slate-100"><span className="text-sm font-semibold">Total</span><span className="text-lg font-bold text-slate-800">{formatMoney(cartTotal)}</span></div><button onClick={handleCreate} disabled={cart.length === 0 || saving} className="w-full mt-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm">{saving ? 'Registrando...' : 'Registrar Compra'}</button></div></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-800">Compras</h2><p className="text-sm text-slate-500 mt-1">Historial de compras a proveedores</p></div><button onClick={() => setCreating(true)} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">+ Nueva Compra</button></div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left"><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Proveedor</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Usuario</th><th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{purchases.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center"><span className="text-3xl block mb-2">📋</span><span className="text-sm text-slate-400">No hay compras registradas</span></td></tr> : purchases.map((p) => (<tr key={p.id} className="hover:bg-slate-50/50"><td className="px-5 py-3 text-xs text-slate-500 font-mono">{p.id.substring(0, 8)}...</td><td className="px-5 py-3 text-slate-700">{formatDate(p.fecha)}</td><td className="px-5 py-3 text-slate-700">{p.proveedor_nombre}</td><td className="px-5 py-3 text-slate-700">{p.usuario_nombre}</td><td className="px-5 py-3 text-right font-medium text-slate-800">{formatMoney(p.total)}</td></tr>))}</tbody></table></div></div>
    </div>
  );
}
