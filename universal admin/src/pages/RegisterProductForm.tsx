import { useState } from 'react';

type FormState = {
  name: string;
  description: string;
  architecture_type: string;
  db_driver: string;
  db_uri: string;
};

export default function RegisterProductForm() {
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    architecture_type: 'SINGLE_DB',
    db_driver: 'MONGODB',
    db_uri: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'architecture_type' && value === 'MULTI_TENANT') {
        updated.db_uri = '';
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        db_uri: form.architecture_type === 'MULTI_TENANT' ? null : form.db_uri,
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isMultiTenant = form.architecture_type === 'MULTI_TENANT';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 p-6">
      <div className="max-w-2xl mx-auto animate-fadeIn">
        {/* Header with gradient text (blue/indigo/cyan) */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
             Register New Product
          </h1>
          <p className="text-gray-600 mt-2 flex items-center justify-center gap-1">
            Add a satellite application — RS256 key pair auto-generated <span>⚡</span>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 space-y-5 border border-white/20 transition-all duration-300 hover:shadow-2xl"
        >
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              📛 Product Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g. DocuSign, Fleet Manager"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              📝 Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of this product"
            />
          </div>

          {/* Architecture + DB Driver */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                🏗️ Architecture Type
              </label>
              <select
                name="architecture_type"
                value={form.architecture_type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="SINGLE_DB">Single DB</option>
                <option value="MULTI_TENANT">Multi-Tenant</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                🗄️ DB Driver
              </label>
              <select
                name="db_driver"
                value={form.db_driver}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="MONGODB">MongoDB</option>
                <option value="MYSQL">MySQL</option>
                <option value="POSTGRESQL">PostgreSQL</option>
              </select>
            </div>
          </div>

          {/* Database URI - hidden for Multi-Tenant */}
          {!isMultiTenant && (
            <div className="animate-slideDown">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                🔗 Database URI
              </label>
              <input
                name="db_uri"
                value={form.db_uri}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                placeholder="mongodb://localhost:27017/my-satellite-db"
              />
            </div>
          )}

          {isMultiTenant && (
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 flex items-center gap-2">
              <span>🔒</span> Multi‑tenant products don't require a Database URI — it will be stored as <code className="bg-white px-1.5 py-0.5 rounded">null</code>.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 text-red-700 text-sm animate-shake">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Registering...
              </>
            ) : (
              <>
                🔑 Register Product & Generate Keys
              </>
            )}
          </button>
        </form>

        {result && (
          <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-md animate-fadeInUp">
            <h2 className="text-green-700 font-bold text-xl flex items-center gap-2">
              ✅ Product Registered! <span className="text-2xl">🎉</span>
            </h2>
            <p className="text-sm text-gray-700 mt-2">
              <strong className="font-mono">Product ID:</strong>{' '}
              <code className="bg-white px-2 py-0.5 rounded text-blue-700">
                {result.product?.product_id}
              </code>
            </p>
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-1">
                🔑 Public Key <span className="text-xs font-normal">(copy to satellite app)</span>
              </p>
              <pre className="bg-gray-900 text-green-300 text-xs p-4 rounded-xl overflow-auto whitespace-pre-wrap font-mono shadow-inner">
                {result.product?.app_public_key}
              </pre>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}