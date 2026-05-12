import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Product = {
  _id: string;
  product_id: string;
  name: string;
  architecture_type: string;
  db_driver: string;
  app_public_key: string;
  createdAt: string;
};

type ProductUser = {
  email: string;
  global_user_id: string;
  role: string;
  status: string;
  username?: string;
};

export default function ProductsDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'users'>('products');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [users, setUsers] = useState<ProductUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(response => {
        const list = Array.isArray(response) 
          ? response 
          : Array.isArray(response.data) 
            ? response.data 
            : [];
        setProducts(list);
        if (list.length > 0) setSelectedProduct(list[0]);
      })
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      navigator.clipboard?.writeText(text).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    }
  };

  const loadUsersForProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveTab('users');
    setUsersLoading(true);
    setUsers([]);
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/products/by-product-id/${product.product_id}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setUsersLoading(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Product Registry</h1>
            <p className="text-gray-500 mt-1 text-sm">Manage satellite apps, RSA keys, and user access</p>
          </div>
          <button
            onClick={() => navigate('/products/new')}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md text-sm"
          >
            + Register Product
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'products' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => (selectedProduct ? loadUsersForProduct(selectedProduct) : setActiveTab('users'))}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Users {selectedProduct ? `· ${selectedProduct.name}` : ''}
          </button>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex justify-center items-center h-48 text-gray-400">Loading products...</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">{error}</div>
        )}

        {/* Products Tab */}
        {!loading && !error && activeTab === 'products' && (
          <div className="space-y-4">
            {products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-white text-gray-400">
                <div className="text-5xl mb-4">📦</div>
                <p className="font-semibold text-gray-500 mb-2">No products registered yet</p>
                <button onClick={() => navigate('/products/new')} className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                  Register your first product
                </button>
              </div>
            )}

            {products.map((product) => (
              <div key={product._id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                {/* Product Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 break-all">{product.product_id}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200">
                      {product.db_driver}
                    </span>
                    <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                      {product.architecture_type}
                    </span>
                    <button
                      onClick={() => loadUsersForProduct(product)}
                      className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      View Users
                    </button>
                  </div>
                </div>

                {/* Public Key — full width, full height */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">RS256 Public Key</h3>
                      <p className="text-xs text-gray-400">Generated by <code className="bg-gray-100 px-1 rounded">crypto.generateKeyPairSync('rsa')</code> on registration</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(product.app_public_key, product._id)}
                      className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition-all border ${
                        copiedId === product._id
                          ? 'bg-green-50 text-green-700 border-green-300'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {copiedId === product._id ? '✓ Copied!' : 'Copy Key'}
                    </button>
                  </div>
                  <pre className="w-full p-4 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl overflow-x-auto whitespace-pre-wrap break-all leading-relaxed text-gray-700">
                    {product.app_public_key || 'No key generated'}
                  </pre>
                </div>

                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                  📅 Registered: {new Date(product.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Users with access to: <span className="text-indigo-600">{selectedProduct?.name || 'N/A'}</span>
            </h2>
            <p className="text-sm text-gray-400 mb-5">Users who have an active Visa for this product</p>

            {usersLoading && <div className="text-gray-400 py-8 text-center">Loading users...</div>}

            {!usersLoading && users.length === 0 && (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <div className="text-4xl mb-3">👤</div>
                <p className="font-semibold text-gray-500">No users provisioned yet</p>
                <p className="text-sm mt-1 text-gray-400">Users will appear here after their first SSO login to this product.</p>
              </div>
            )}

            {users.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 rounded-l-lg">Email</th>
                    <th className="px-4 py-3">Global ID</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 rounded-r-lg">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-gray-800">{u.email}</td>
                      <td className="px-4 py-3 font-mono text-gray-500 text-xs">{u.global_user_id}</td>
                      <td className="px-4 py-3 text-gray-600">{u.role}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
