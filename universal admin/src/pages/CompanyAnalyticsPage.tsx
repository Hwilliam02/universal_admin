import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck2, UserX2, Activity, ChevronLeft, Settings, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import type { ApiResponse } from '@/types';
import { api } from '@/api/axiosConfig';

interface CompanyAnalyticsResponse {
  companyId: string;
  is_supplies_enabled?: boolean;
  delivery_type?: string;
  companyName: string;
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  lastActivity?: {
    action?: string;
    module?: string;
    createdAt?: string;
    message?: string;
    userEmail?: string;
  };
  lastLogins: Array<{
    userId: string;
    userEmail?: string;
    createdAt?: string;
  }>;
    enabled_features?: {
      billing: boolean;
      reports: boolean;
      map_monitoring: boolean;
      messaging: boolean;
      teams: boolean;
    };
    capacity_limits?: {
      max_users: number;
      max_admins: number;
      max_dispatchers: number;
      max_drivers: number;
      max_managers: number;
      max_jobs_per_day: number;
      max_trips_per_day: number;
      max_clinics: number;
      max_routes: number;
      max_willcalls: number;
    };
}

function formatDateTime(dateString?: string) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString();
}

export default function CompanyAnalyticsPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { companyName?: string } };
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [data, setData] = useState<CompanyAnalyticsResponse | null>(null);
  const [features, setFeatures] = useState<NonNullable<CompanyAnalyticsResponse['enabled_features']>>({
    billing: true,
    reports: true,
    map_monitoring: true,
    messaging: true,
    teams: true
  });
  const [limits, setLimits] = useState<Record<string, number | string>>({
    max_users: 0,
    max_admins: 0,
    max_dispatchers: 0,
    max_drivers: 0,
    max_managers: 0,
    max_jobs_per_day: 0,
    max_trips_per_day: 0,
    max_clinics: 0,
    max_routes: 0,
    max_willcalls: 0
  });
  const [savingFeature, setSavingFeature] = useState<string | null>(null);
  const [savingLimits, setSavingLimits] = useState(false);

  const displayCompanyName = data?.companyName || location.state?.companyName || 'Company';

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!companyId) return;
      try {
        setLoading(true);
        setError(undefined);
        const res = await api.get<ApiResponse<CompanyAnalyticsResponse>>(`/analytics/company/${companyId}`);
        const result = res.data.data as unknown as CompanyAnalyticsResponse;
        setData(result);
        if (result.enabled_features) {
          setFeatures(result.enabled_features);
        }
        if (result.capacity_limits) {
          setLimits(result.capacity_limits);
        }
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : typeof e === 'object' && e !== null && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load analytics'
            : 'Failed to load analytics';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [companyId]);

  const handleFeatureToggle = async (feature: string, value: boolean) => {
    if (!companyId) return;
    try {
      setSavingFeature(feature);
      await api.patch(`/company/update-features/${companyId}`, {
        feature,
        value
      });
      toast({
        title: "Feature Updated",
        description: `${feature.charAt(0).toUpperCase() + feature.slice(1).replace('_', ' ')} has been ${value ? 'enabled' : 'disabled'} successfully.`,
        variant: "success",
      });
    } catch (e) {
      console.error(`Failed to update feature ${feature}:`, e);
      // Revert state on error
      setFeatures(prev => ({ ...prev, [feature]: !value }));
      toast({
        title: "Update Failed",
        description: `Failed to update ${feature} setting. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setSavingFeature(null);
    }
  };

  const handleSuppliesToggle = async (checked: boolean) => {
    if (!companyId) return;
    try {
      setSavingFeature('supplies');
      await api.patch(`/company/supplies/${companyId}`, { is_supplies_enabled: checked });
      setData(prev => prev ? { ...prev, is_supplies_enabled: checked } : null);
      toast({
        title: "Module Updated",
        description: `Supplies module has been ${checked ? 'enabled' : 'disabled'} successfully.`,
        variant: "success",
      });
    } catch (e) {
      console.error('Failed to update supplies status:', e);
      toast({
        title: "Update Failed",
        description: "Failed to update supplies status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingFeature(null);
    }
  };

  const handleSaveLimits = async () => {
    if (!companyId) return;
    try {
      setSavingLimits(true);
      // Ensure all values are numeric for the API
      const numericLimits = Object.fromEntries(
        Object.entries(limits).map(([k, v]) => [k, v === "" ? 0 : Number(v)])
      );
      await api.patch(`/company/update-limits/${companyId}`, { limits: numericLimits });
      
      // Refresh data
      const res = await api.get<ApiResponse<CompanyAnalyticsResponse>>(`/analytics/company/${companyId}`);
      setData(res.data.data as unknown as CompanyAnalyticsResponse);
      
      toast({
        title: "Settings Saved",
        description: "Company capacity limits have been updated successfully.",
        variant: "success",
      });
    } catch (e) {
      console.error('Failed to update capacity limits:', e);
      toast({
        title: "Save Failed",
        description: "Failed to update capacity limits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingLimits(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-4 md:p-8 max-w-[1600px]">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">{displayCompanyName} Analytics</h1>
            <p className="text-slate-600 text-sm">Overview of users and recent activity for this company</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {/* Stats Overview - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-semibold text-blue-800">
                Total Users
                <Users className="w-5 h-5 opacity-70" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {loading && !data ? '...' : data?.totalUsers ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-semibold text-emerald-800">
                Active Users
                <UserCheck2 className="w-5 h-5 opacity-70" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900">
                {loading && !data ? '...' : data?.activeUsers ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-semibold text-amber-800">
                Suspended
                <UserX2 className="w-5 h-5 opacity-70" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900">
                {loading && !data ? '...' : data?.suspendedUsers ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Settings Panel (Wider) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="shadow-md border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800 uppercase tracking-tight">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  Company Settings
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">Manage configurations for this environment</p>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="flex w-full justify-start rounded-none border-b bg-slate-50/50 p-0 h-11">
                    <TabsTrigger value="general" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-white px-4 py-2 text-xs font-bold">General</TabsTrigger>
                    <TabsTrigger value="appearance" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-white px-4 py-2 text-xs font-bold">Appearance</TabsTrigger>
                    <TabsTrigger value="modules" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-white px-4 py-2 text-xs font-bold">Modules & Limits</TabsTrigger>
                    {data?.delivery_type !== "willcall" && (
                      <TabsTrigger value="supplies" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-white px-4 py-2 text-xs font-bold">Supplies</TabsTrigger>
                    )}
                    <TabsTrigger value="notifications" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-white px-4 py-2 text-xs font-bold">Alerts</TabsTrigger>
                    <TabsTrigger value="advanced" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-white px-4 py-2 text-xs font-bold">Advanced</TabsTrigger>
                  </TabsList>
                  
                  <div className="p-8">
                    <TabsContent value="general" className="space-y-6 mt-0">
                      <div className="grid gap-3">
                        <Label htmlFor="company-name" className="text-xs font-bold text-slate-700">Company Name</Label>
                        <Input id="company-name" defaultValue={displayCompanyName} className="bg-slate-50/50 h-11" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between rounded-xl border p-5 bg-slate-50/30 shadow-sm transition-all hover:border-indigo-100">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Active Status</Label>
                            <p className="text-xs text-slate-500">Enable platform access.</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between rounded-xl border p-5 bg-slate-50/30 shadow-sm transition-all hover:border-indigo-100">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Require 2FA</Label>
                            <p className="text-xs text-slate-500">Force two-factor authentication.</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between rounded-xl border p-5 bg-slate-50/30 shadow-sm transition-all hover:border-indigo-100">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Custom Logo Header</Label>
                            <p className="text-xs text-slate-500">Allow custom logo uploads.</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between rounded-xl border p-5 bg-slate-50/30 shadow-sm transition-all hover:border-indigo-100">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Dark Mode Enforcement</Label>
                            <p className="text-xs text-slate-500">Force dark mode for all users.</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="modules" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between rounded-xl border p-5 bg-slate-50/30 border-blue-100 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-100 text-blue-700 h-5 px-1.5 uppercase text-[9px] font-black hover:bg-blue-100 pointer-events-none border-none">Pro</Badge>
                              <Label className="text-sm font-bold">Billing Module</Label>
                            </div>
                            <p className="text-xs text-slate-500">Enable automated invoicing.</p>
                          </div>
                          <Switch 
                            checked={features.billing} 
                            onCheckedChange={async (checked) => {
                              setFeatures(prev => ({ ...prev, billing: checked }));
                              await handleFeatureToggle('billing', checked);
                            }}
                            disabled={savingFeature === 'billing'}
                          />
                        </div>
                        {data?.delivery_type !== "willcall" && (
                        <div className="flex items-center justify-between rounded-xl border p-5 bg-slate-50/30 border-emerald-100 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-100 text-emerald-700 h-5 px-1.5 uppercase text-[9px] font-black hover:bg-emerald-100 pointer-events-none border-none">Live</Badge>
                              <Label className="text-sm font-bold">Map Monitoring</Label>
                            </div>
                            <p className="text-xs text-slate-500">Real-time driver tracking.</p>
                          </div>
                          <Switch 
                            checked={features.map_monitoring} 
                            onCheckedChange={async (checked) => {
                              setFeatures(prev => ({ ...prev, map_monitoring: checked }));
                              await handleFeatureToggle('map_monitoring', checked);
                            }}
                            disabled={savingFeature === 'map_monitoring'}
                          />
                        </div>
                        )}
                         <div className="flex items-center justify-between rounded-xl border p-5 bg-slate-50/30 border-emerald-100 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-100 text-emerald-700 h-5 px-1.5 uppercase text-[9px] font-black hover:bg-emerald-100 pointer-events-none border-none">Live</Badge>
                              <Label className="text-sm font-bold">Report</Label>
                            </div>
                            <p className="text-xs text-slate-500">Generate detailed analytics and operational reports.</p>
                          </div>
                          <Switch 
                            checked={features.reports} 
                            onCheckedChange={async (checked) => {
                              setFeatures(prev => ({ ...prev, reports: checked }));
                              await handleFeatureToggle('reports', checked);
                            }}
                            disabled={savingFeature === 'reports'}
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-xl border p-5 bg-slate-50/30 border-purple-100 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-purple-100 text-purple-700 h-5 px-1.5 uppercase text-[9px] font-black hover:bg-purple-100 pointer-events-none border-none">Chat</Badge>
                              <Label className="text-sm font-bold">Messaging Module</Label>
                            </div>
                            <p className="text-xs text-slate-500">Enable private chat and broadcast messages.</p>
                          </div>
                          <Switch 
                            checked={features.messaging} 
                            onCheckedChange={async (checked) => {
                              setFeatures(prev => ({ ...prev, messaging: checked }));
                              await handleFeatureToggle('messaging', checked);
                            }}
                            disabled={savingFeature === 'messaging'}
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-xl border p-5 bg-slate-50/30 border-indigo-100 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-indigo-100 text-indigo-700 h-5 px-1.5 uppercase text-[9px] font-black hover:bg-indigo-100 pointer-events-none border-none">Teams</Badge>
                              <Label className="text-sm font-bold">Teams Module</Label>
                            </div>
                            <p className="text-xs text-slate-500">Manage multiple dispatch teams.</p>
                          </div>
                          <Switch 
                            checked={features.teams} 
                            onCheckedChange={async (checked) => {
                              setFeatures(prev => ({ ...prev, teams: checked }));
                              await handleFeatureToggle('teams', checked);
                            }}
                            disabled={savingFeature === 'teams'}
                          />
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Capacity Limits</h4>
                            <p className="text-xs text-slate-500 font-medium">Define resource constraints for this organization.</p>
                          </div>
                          <Badge className="bg-slate-100 text-slate-600 border-none px-2 py-1 text-[9px] font-black uppercase">Plan Manager</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            { label: 'Max Users', key: 'max_users' },
                            { label: 'Max Admins', key: 'max_admins' },
                            { label: 'Max Dispatchers', key: 'max_dispatchers' },
                            { label: 'Max Drivers', key: 'max_drivers' },
                            { label: 'Max Managers', key: 'max_managers' },
                            ...(data?.delivery_type === 'willcall'
                              ? [
                                  { label: 'Max Routes', key: 'max_routes' },
                                  { label: 'Max Will Calls/Day', key: 'max_willcalls' },
                                ]
                              : [
                                  { label: 'Max Jobs/Day', key: 'max_jobs_per_day' },
                                  { label: 'Max Trips/Day', key: 'max_trips_per_day' },
                                  { label: 'Max Clinics', key: 'max_clinics' },
                                ]),
                          ].map((item) => (
                            <div key={item.key} className="p-4 rounded-xl border bg-white shadow-sm space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-black uppercase text-slate-500 tracking-tight">{item.label}</Label>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Unlimited</span>
                                  <Switch 
                                    checked={Number(limits[item.key as keyof typeof limits]) === 0 && limits[item.key as keyof typeof limits] !== ""}
                                    onCheckedChange={(checked) => {
                                      setLimits(prev => ({ ...prev, [item.key]: checked ? 0 : 50 }));
                                    }}
                                  />
                                </div>
                              </div>
                              <Input 
                                type="number" 
                                value={limits[item.key as keyof typeof limits]} 
                                onChange={(e) => setLimits(prev => ({ ...prev, [item.key]: e.target.value }))}
                                disabled={Number(limits[item.key as keyof typeof limits]) === 0 && limits[item.key as keyof typeof limits] !== ""}
                                className="bg-slate-50 border-none h-10 font-bold text-slate-900 focus-visible:ring-slate-200"
                              />
                            </div>
                          ))}
                        </div>
                        
                        <p className="text-[10px] text-slate-400 mt-4 font-medium flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 border-dashed">
                          <Activity className="w-3 h-3 text-slate-400" />
                          <span>* Usage exceeding these limits will block creation of new resources and trigger an override notification.</span>
                        </p>
                      </div>
                    </TabsContent>
                    
                    {data?.delivery_type !== "willcall" && (
                      <TabsContent value="supplies" className="space-y-6 mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between rounded-xl border p-5 bg-emerald-50/30 border-emerald-100 shadow-sm">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-bold text-emerald-900">Enable Supplies</Label>
                              <p className="text-xs text-emerald-600">Allow supply ordering.</p>
                            </div>
                            <Switch 
                              checked={data?.is_supplies_enabled} 
                              onCheckedChange={handleSuppliesToggle}
                              disabled={savingFeature === 'supplies'}
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-xl border p-5 bg-slate-50/30 shadow-sm">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-bold">Auto-reorder Low Stock</Label>
                              <p className="text-xs text-slate-500">Automatic generation of requests.</p>
                            </div>
                            <Switch />
                          </div>
                        </div>
                        <div className="grid gap-3">
                          <Label htmlFor="threshold" className="text-xs font-bold">Low Stock Threshold</Label>
                          <Input id="threshold" type="number" defaultValue="25" className="bg-slate-50/50 h-11" />
                        </div>
                      </TabsContent>
                    )}

                    <TabsContent value="notifications" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between rounded-xl border p-5 bg-slate-50/30 shadow-sm">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Daily Activity Digest</Label>
                            <p className="text-xs text-slate-500">Send email summary daily.</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between rounded-xl border p-5 bg-slate-50/30 shadow-sm">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold">SMS Alerts</Label>
                            <p className="text-xs text-slate-500">SMS for urgent notifications.</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="advanced" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between rounded-xl border p-5 bg-slate-50/30 shadow-sm">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold">API Access</Label>
                            <p className="text-xs text-slate-500">Allow programmatic access.</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-red-100 p-5 bg-red-50/30 shadow-sm">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold text-red-700">Strict Data Residency</Label>
                            <p className="text-xs text-red-600">Enforce local data processing.</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <Button 
                  type="button" 
                  onClick={handleSaveLimits}
                  disabled={savingLimits}
                  className="gap-2 bg-slate-900 border-none hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 h-10 px-8 transition-all active:scale-95 font-bold text-sm rounded-lg"
                >
                  <Save className={savingLimits ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                  {savingLimits ? "Saving Changes..." : "Save Company Settings"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column: Activity Stack (Narrower) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Last Activity Card */}
            <Card className="shadow-md border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-5">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-tight">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Last Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {loading && !data ? (
                  <div className="text-slate-500 text-xs animate-pulse">Loading activity...</div>
                ) : !data?.lastActivity ? (
                  <div className="text-slate-500 text-xs text-center py-4">No activity found.</div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Action</span>
                      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100 font-bold px-2 py-0 h-5">
                        {data.lastActivity.action || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                      <span className="text-slate-500 font-medium">Module</span>
                      <span className="font-bold text-slate-800">{data.lastActivity.module || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                      <span className="text-slate-500 font-medium">Time</span>
                      <span className="font-bold text-slate-800">{formatDateTime(data.lastActivity.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-50 pt-2">
                      <span className="text-slate-500 font-medium">User</span>
                      <span className="font-bold text-slate-800 truncate max-w-[120px]" title={data.lastActivity.userEmail}>
                        {data.lastActivity.userEmail || 'N/A'}
                      </span>
                    </div>
                    {data.lastActivity.message && (
                      <div className="pt-2 mt-2 border-t border-slate-100">
                        <p className="text-slate-500 font-medium mb-1.5 uppercase text-[10px] tracking-wider">Message</p>
                        <p className="text-slate-700 leading-normal font-semibold bg-slate-50 p-2.5 rounded-md border border-slate-100 text-[11px]">
                          {data.lastActivity.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Last 5 Logins Card */}
            <Card className="shadow-md border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-5">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-tight">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Last 5 Logins
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {loading && !data ? (
                  <div className="text-slate-500 text-xs animate-pulse">Loading logins...</div>
                ) : !data?.lastLogins || data.lastLogins.length === 0 ? (
                  <div className="text-slate-500 text-xs text-center py-4">No recent logins.</div>
                ) : (
                  <div className="space-y-2">
                    {data.lastLogins.map((login) => (
                      <div
                        key={login.userId + (login.createdAt || '')}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-all border border-slate-100 hover:border-indigo-100 shadow-sm"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-800 text-[11px] truncate" title={login.userEmail}>
                            {login.userEmail || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 font-medium">{formatDateTime(login.createdAt)}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter font-black bg-white border-slate-200 text-indigo-600 px-1 h-4">
                          Login
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
