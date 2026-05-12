import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Mail,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Briefcase,
  TrendingUp,
  Clock,
  Truck,
} from 'lucide-react';
import type { Lead } from '@/types';

interface LeadDetailsDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeadDetailsDialog({ lead, open, onOpenChange }: LeadDetailsDialogProps) {
  if (!lead) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) => (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-900 break-words">
        {value || 'N/A'}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {lead.logo_url ? (
                <img
                  src={lead.logo_url}
                  alt={`${lead.company_name} logo`}
                  className="h-16 w-16 object-contain rounded-xl border-2 border-gray-100 bg-white p-1 shadow-sm"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 text-gray-400">
                  <Building2 className="h-8 w-8" />
                </div>
              )}
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {lead.company_name || 'Unnamed Company'}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="capitalize px-2 py-0">
                    {lead.status}
                  </Badge>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Submitted {formatDate(lead.createdAt)}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Contact Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-600 flex items-center gap-2 border-b border-blue-50 pb-2 uppercase tracking-tight">
              <User className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <InfoItem icon={User} label="Full Name" value={lead.contact_person} />
              <InfoItem icon={Mail} label="Work Email" value={lead.email} />
              <InfoItem icon={Phone} label="Phone Number" value={lead.phone} />
              <InfoItem icon={Briefcase} label="Role" value={lead.your_role} />
            </div>
          </div>

          {/* Lead/Company Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-indigo-600 flex items-center gap-2 border-b border-indigo-50 pb-2 uppercase tracking-tight">
              <Building2 className="h-4 w-4" />
              Lead Details
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <InfoItem icon={Building2} label="Company Type" value={lead.company_type} />
              <InfoItem icon={Truck} label="Delivery Model" value={lead.delivery_model} />
              <InfoItem icon={TrendingUp} label="Monthly Order Value" value={lead.monthly_order_value} />
              <InfoItem icon={Clock} label="Implementation Timeline" value={lead.implementation_timeline} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
           {/* Logistics Section */}
           <div className="space-y-4">
            <h3 className="text-sm font-bold text-purple-600 flex items-center gap-2 border-b border-purple-50 pb-2 uppercase tracking-tight">
              <MapPin className="h-4 w-4" />
              Logistics
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <InfoItem icon={MapPin} label="Service Area / City" value={lead.service_area} />
              <InfoItem icon={Truck} label="Fleet Size / Vehicle" value={lead.fleet_size} />
              <InfoItem 
                icon={Mail} 
                label="Portal Type" 
                value={lead.delivery_type === 'job' ? 'Job Board' : lead.delivery_type === 'willcall' ? 'Will Call' : 'N/A'} 
              />
            </div>
          </div>

          {/* Additional Notes Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-600 flex items-center gap-2 border-b border-gray-50 pb-2 uppercase tracking-tight">
              <FileText className="h-4 w-4" />
              Additional Notes
            </h3>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 min-h-[120px]">
               <p className="text-sm text-gray-600 italic whitespace-pre-wrap break-words leading-relaxed">
                 {lead.notes || 'No additional notes provided.'}
               </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
