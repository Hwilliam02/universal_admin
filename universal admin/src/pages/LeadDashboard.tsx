import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useLeadStore } from "@/store/leadStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateLeadDialog from "@/pages/CreateLeadDialog";
import LeadDetailsDialog from "@/pages/LeadDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Calendar,
  Trash2,
  Activity,
  Phone,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Lead } from "@/types";

export default function LeadDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuthStore();
  const {
    leads,
    fetchLeads,
    updateLeadStatus,
    deleteLead,
  } = useLeadStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    type: "status" | "delete";
    id: string;
    value?: string;
    name?: string;
  } | null>(null);
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch leads on mount
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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

  // Filter leads by search and status
  const { newLeads, contactedLeads, convertedLeads, rejectedLeads } = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    const searchedLeads = leads.filter((lead) => {
      const companyName = lead.company_name?.toLowerCase() || "";
      const contactPerson = lead.contact_person?.toLowerCase() || "";
      const email = lead.email?.toLowerCase() || "";
      const serviceArea = lead.service_area?.toLowerCase() || "";
      const companyType = lead.company_type?.toLowerCase() || "";
      const yourRole = lead.your_role?.toLowerCase() || "";
      const deliveryModel = lead.delivery_model?.toLowerCase() || "";

      return (
        companyName.includes(q) ||
        contactPerson.includes(q) ||
        email.includes(q) ||
        serviceArea.includes(q) ||
        companyType.includes(q) ||
        yourRole.includes(q) ||
        deliveryModel.includes(q)
      );
    });

    return {
      newLeads: searchedLeads.filter((l) => l.status === "new"),
      contactedLeads: searchedLeads.filter((l) => l.status === "contacted"),
      convertedLeads: searchedLeads.filter((l) => l.status === "converted"),
      rejectedLeads: searchedLeads.filter((l) => l.status === "rejected"),
    };
  }, [leads, searchQuery]);

  const getStatusVariant = (status: Lead["status"]) => {
    switch (status) {
      case "new":
        return "info";
      case "contacted":
        return "secondary";
      case "converted":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: Lead["status"]) => {
    switch (status) {
      case "new":
        return <AlertCircle className="h-3 w-3 mr-1" />;
      case "contacted":
        return <Phone className="h-3 w-3 mr-1" />;
      case "converted":
        return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case "rejected":
        return <XCircle className="h-3 w-3 mr-1" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleStatusChange = (id: string, status: string, name: string) => {
    setPendingAction({ type: "status", id, value: status, name });
  };

  const confirmStatusChange = async () => {
    if (pendingAction && pendingAction.type === "status") {
      const success = await updateLeadStatus(pendingAction.id, pendingAction.value!);
      if (success) {
        toast({
          title: "Status updated",
          description: `Lead status changed to ${pendingAction.value}.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update lead status.",
          variant: "destructive",
        });
      }
      setPendingAction(null);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setPendingAction({ type: "delete", id, name });
  };

  const confirmDelete = async () => {
    if (pendingAction && pendingAction.type === "delete") {
      const success = await deleteLead(pendingAction.id);
      if (success) {
        toast({
          title: "Lead deleted",
          description: `${pendingAction.name} has been deleted.`,
          variant: "destructive",
        });
      }
      setPendingAction(null);
    }
  };

  // Renders a lead table for any given list
  const renderLeadTable = (leadsList: Lead[], emptyMessage: string) => (
    <>
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="font-semibold w-[72px] text-center">Logo</TableHead>
            <TableHead className="font-semibold">Company Name</TableHead>
            <TableHead className="font-semibold">Full Name</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="text-center font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Created</TableHead>
            <TableHead className="text-center font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leadsList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <Building2 className="h-12 w-12 text-gray-300" />
                  <p className="text-gray-500 font-medium">
                    {searchQuery ? "No leads found matching your search" : emptyMessage}
                  </p>
                  {searchQuery && (
                    <p className="text-sm text-gray-400">
                      Try adjusting your search criteria
                    </p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            leadsList.map((lead) => (
              <TableRow
                key={lead._id}
                className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedLeadForDetails(lead);
                  setIsDetailsOpen(true);
                }}
              >
                <TableCell className="text-center">
                  {lead.logo_url ? (
                    <img
                      src={lead.logo_url}
                      alt={`${lead.company_name} logo`}
                      className="h-10 w-10 object-contain rounded-lg border border-gray-200 bg-white mx-auto"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 mx-auto">
                      N/A
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-semibold text-gray-900">
                  {lead.company_name || "N/A"}
                </TableCell>
                <TableCell className="text-gray-600">
                  {lead.contact_person || "N/A"}
                </TableCell>
                <TableCell className="text-gray-600">
                  {lead.email}
                </TableCell>
                <TableCell className="text-gray-600 font-medium text-center">
                  {lead.delivery_type === "job"
                    ? "Job Board"
                    : lead.delivery_type === "willcall"
                      ? "Will Call"
                      : "N/A"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusVariant(lead.status)}
                    className="font-medium capitalize px-2.5 py-0.5"
                  >
                    {getStatusIcon(lead.status)}
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    {formatDate(lead.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    {lead.status !== "contacted" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(lead._id, "contacted", lead.company_name || "Unknown");
                        }}
                        className="h-8 px-3 bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                        title="Mark as Contacted"
                      >
                        <Phone className="h-3.5 w-3.5 mr-1" />
                        Contacted
                      </Button>
                    )}
                    {lead.status !== "converted" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(lead._id, "converted", lead.company_name || "Unknown");
                        }}
                        className="h-8 px-3 bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:text-green-800 transition-colors"
                        title="Mark as Converted"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Converted
                      </Button>
                    )}
                    {lead.status !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(lead._id, "rejected", lead.company_name || "Unknown");
                        }}
                        className="h-8 px-3 bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100 hover:text-yellow-800 transition-colors"
                        title="Mark as Rejected"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Rejected
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(lead._id, lead.company_name || "Unknown");
                      }}
                      className="h-8 px-3 bg-red-50 text-red-700 border-red-300 hover:bg-red-100 hover:text-red-800 transition-colors"
                      title="Delete Lead"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    
    <LeadDetailsDialog 
      lead={selectedLeadForDetails} 
      open={isDetailsOpen} 
      onOpenChange={setIsDetailsOpen} 
    />
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-2xl sticky top-0 z-10">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/30 backdrop-blur-md p-3 rounded-2xl shadow-xl border-2 border-white/40">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-white drop-shadow-lg tracking-tight">
                  Lead Dashboard
                </h1>
                <p className="text-blue-50 mt-1.5 flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Welcome back,{" "}
                  <span className="font-bold text-white">
                    {user?.first_name
                      ? `${user.first_name} ${user.last_name}`
                      : "Lead User"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/logs")}
                className="gap-2 bg-white/10 text-white border-white/30 hover:bg-white/20 transition-all font-semibold"
              >
                Logs
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/monitor")}
                className="gap-2 bg-white/10 text-white border-white/30 hover:bg-white/20 transition-all font-semibold"
              >
                <Activity className="h-4 w-4" />
                System Monitor
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-2 bg-white text-red-600 border-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all shadow-lg font-semibold"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 border-2 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                    New Leads
                  </p>
                  <h3 className="text-4xl font-extrabold text-blue-700">
                    {leads.filter((l) => l.status === "new").length}
                  </h3>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                  <AlertCircle className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-blue-600 font-medium">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Awaiting contact</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 via-indigo-50 to-indigo-100 border-2 border-indigo-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                    Contacted
                  </p>
                  <h3 className="text-4xl font-extrabold text-indigo-700">
                    {leads.filter((l) => l.status === "contacted").length}
                  </h3>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <Phone className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-indigo-600 font-medium">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span>In progress</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-2 border-green-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
                    Converted
                  </p>
                  <h3 className="text-4xl font-extrabold text-green-700">
                    {leads.filter((l) => l.status === "converted").length}
                  </h3>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-green-600 font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Successfully converted</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 border-2 border-yellow-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-2">
                    Rejected
                  </p>
                  <h3 className="text-4xl font-extrabold text-yellow-700">
                    {leads.filter((l) => l.status === "rejected").length}
                  </h3>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-xl shadow-lg">
                  <XCircle className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-yellow-600 font-medium">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Not qualified</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  Leads Management
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage all leads and their statuses • {leads.length} total
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <CreateLeadDialog />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mt-2 mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search leads by company, contact, email or area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>

            <Tabs defaultValue="new" className="w-full">
              <TabsList className="grid w-full sm:w-[500px] grid-cols-4 h-10 mb-4">
                <TabsTrigger value="new" className="text-sm font-medium">
                  New ({newLeads.length})
                </TabsTrigger>
                <TabsTrigger value="contacted" className="text-sm font-medium">
                  Contacted ({contactedLeads.length})
                </TabsTrigger>
                <TabsTrigger value="converted" className="text-sm font-medium">
                  Converted ({convertedLeads.length})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-sm font-medium">
                  Rejected ({rejectedLeads.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-0">
                {renderLeadTable(newLeads, "No new leads yet. Create your first lead!")}
              </TabsContent>

              <TabsContent value="contacted" className="mt-0">
                {renderLeadTable(contactedLeads, "No contacted leads")}
              </TabsContent>

              <TabsContent value="converted" className="mt-0">
                {renderLeadTable(convertedLeads, "No converted leads yet")}
              </TabsContent>

              <TabsContent value="rejected" className="mt-0">
                {renderLeadTable(rejectedLeads, "No rejected leads")}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "delete"
                ? "Delete Lead"
                : "Change Status"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "delete"
                ? `Are you sure you want to delete the lead "${pendingAction.name}"? This action cannot be undone.`
                : `Are you sure you want to change the lead status to "${pendingAction?.value}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                pendingAction?.type === "delete"
                  ? confirmDelete
                  : confirmStatusChange
              }
              className={
                pendingAction?.type === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : pendingAction?.value === "converted"
                    ? "bg-green-600 hover:bg-green-700"
                    : pendingAction?.value === "contacted"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : pendingAction?.value === "rejected"
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : ""
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
