import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import client from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  LayoutDashboard, 
  ExternalLink, 
  Shield, 
  Package,
  Loader2,
  Box,
  Building2,
  Lock,
  ShoppingCart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Product, ApiResponse, Visa } from '@/types';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await client.get<ApiResponse<Product[]>>('/api/products');
      if (response.data.status === 'success' || response.data.status === true) {
        setProducts(response.data.data || []);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch products.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully.',
    });
  };

  const getUserVisa = (productId: string): Visa | undefined => {
    return user?.visas?.find((v: any) => v.product_id === productId || v.product === productId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Company Portal</h1>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Admin: {user?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right mr-2">
              <p className="text-sm font-semibold text-slate-900">{user?.email}</p>
              <p className="text-xs text-slate-500">Corporate Admin</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-slate-600 hover:text-red-600 hover:bg-red-50 border-slate-200 gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-blue-600" />
            Product Ecosystem
          </h2>
          <p className="text-slate-600 mt-2 text-lg">
            Manage your existing subscriptions or discover new products for your company.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-medium">Loading your ecosystem...</p>
          </div>
        ) : products.length === 0 ? (
          <Card className="border-dashed border-2 py-20 text-center">
            <CardContent>
              <Box className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800">No Products Found</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2">
                There are currently no products registered in the marketplace.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const visa = getUserVisa(product.product_id);
              const isActive = visa && visa.status === 'Active';

              return (
                <Card key={product._id} className={`group hover:shadow-2xl transition-all duration-300 border-slate-200 overflow-hidden flex flex-col ${!isActive ? 'grayscale-[0.5] opacity-90' : ''}`}>
                  <div className={`h-2 bg-gradient-to-r ${isActive ? 'from-blue-500 via-indigo-500 to-purple-500' : 'from-slate-400 to-slate-500'}`} />
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className={`p-3 rounded-xl transition-colors ${isActive ? 'bg-slate-100 group-hover:bg-blue-50' : 'bg-slate-100'}`}>
                        <Package className={`h-6 w-6 ${isActive ? 'text-slate-600 group-hover:text-blue-600' : 'text-slate-400'}`} />
                      </div>
                      <Badge 
                        variant={isActive ? "default" : "secondary"} 
                        className={`uppercase text-[10px] font-bold ${isActive ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {isActive ? 'Active Subscription' : 'Not Subscribed'}
                      </Badge>
                    </div>
                    <CardTitle className={`text-2xl mt-4 transition-colors ${isActive ? 'group-hover:text-blue-700' : 'text-slate-700'}`}>
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase">Architecture</span>
                        <span className="text-sm font-semibold text-slate-700">{product.architecture_type}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
                        <span className={`text-sm font-semibold ${isActive ? 'text-green-600' : 'text-slate-500'}`}>
                          {isActive ? 'Ready to use' : 'Needs provisioning'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4">
                    {isActive ? (
                      <Button className="w-full bg-white text-blue-600 hover:bg-blue-600 hover:text-white border-blue-200 shadow-sm transition-all gap-2 group-hover:scale-[1.02]">
                        <ExternalLink className="h-4 w-4" />
                        Open Portal
                      </Button>
                    ) : (
                      <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all gap-2 group-hover:scale-[1.02]">
                        <ShoppingCart className="h-4 w-4" />
                        Subscribe Now
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            © 2026 Company Portal. All rights reserved. Powered by Universal Master.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
