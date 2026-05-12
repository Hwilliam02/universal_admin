import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Code2, LogOut, Package, PlusCircle } from "lucide-react";

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "success",
      });
      navigate("/login");
    } catch {
      toast({
        title: "Logout Error",
        description: "There was an issue logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name}`
    : "Developer";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100">
      <header className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 shadow-xl">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/15 border border-white/20 rounded-2xl p-3">
              <Code2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Developer Console
              </h1>
              <p className="text-slate-200 text-sm mt-1">
                Signed in as {displayName}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 bg-white text-red-600 border-white hover:bg-red-50 hover:text-red-700 hover:border-red-200"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Product tools
          </h2>
          <p className="text-slate-600 text-sm">
            Access the product registry and onboarding workflows.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Package className="h-5 w-5 text-indigo-600" />
                View Products
              </CardTitle>
              <CardDescription>
                Browse registered products and manage access details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/products")}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Open Registry
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <PlusCircle className="h-5 w-5 text-emerald-600" />
                Register Product
              </CardTitle>
              <CardDescription>
                Create a new product record and generate credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/products/new")}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Start Registration
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
