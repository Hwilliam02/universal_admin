import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLeadStore } from '@/store/leadStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Plus, Building2, Mail, User, Phone, MapPin, ImagePlus, X, FileText, Calendar } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const leadSchema = z.object({
  company_name: z.string().max(60, 'Company name can be maximum of 60 characters').optional().or(z.literal('')),
  contact_person: z.string().max(60, 'Full name can be maximum of 60 characters').optional().or(z.literal('')),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(15, 'Phone number cannot exceed 15 characters').optional().or(z.literal('')),
  service_area: z.string().max(100, 'Service area cannot exceed 100 characters').optional().or(z.literal('')),
  delivery_type: z.string().optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional().or(z.literal('')),
  logo: z.any().optional(),
  company_type: z.string().optional(),
  delivery_model: z.string().optional(),
  monthly_order_value: z.string().optional(),
  implementation_timeline: z.string().optional(),
  your_role: z.string().optional(),
  fleet_size: z.string().optional(),
});

export default function CreateLeadDialog() {
  const [open, setOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const addLead = useLeadStore((state) => state.addLead);

  const form = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      service_area: '',
      delivery_type: 'willcall',
      notes: '',
      logo: undefined,
      company_type: '',
      delivery_model: '',
      monthly_order_value: '',
      implementation_timeline: '',
      your_role: '',
      fleet_size: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof leadSchema>) => {
    try {
      const leadData = {
        company_name: data.company_name,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        service_area: data.service_area,
        delivery_type: data.delivery_type,
        notes: data.notes,
        logoFile: logoFile || undefined,
        company_type: data.company_type,
        delivery_model: data.delivery_model,
        monthly_order_value: data.monthly_order_value,
        implementation_timeline: data.implementation_timeline,
        your_role: data.your_role,
        fleet_size: data.fleet_size,
      };

      await addLead(leadData);
      toast({
        title: 'Lead created',
        description: `Lead for ${data.email} has been successfully created.`,
        variant: 'success',
      });
      form.reset();
      setLogoPreview(null);
      setLogoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setOpen(false);
    } catch (error) {
      let errorMessage = 'Failed to create lead. Please try again.';

      if (typeof error === 'object' && error !== null) {
        const errWithResponse = error as { response?: { data?: { message?: string } } };
        if (errWithResponse.response?.data?.message) {
          errorMessage = errWithResponse.response.data.message;
        } else if ('message' in error && typeof (error as { message?: string }).message === 'string') {
          errorMessage = (error as { message?: string }).message || errorMessage;
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Only PNG, JPEG, WEBP, and SVG formats are allowed.',
          variant: 'destructive',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Logo size must be less than 5MB',
          variant: 'destructive',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setLogoFile(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
          <Plus className="h-4 w-4" />
          Create Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-2xl">Create New Lead</DialogTitle>
          </div>
          <DialogDescription>
            Add a new lead to your pipeline. Only Work Email is required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} className="h-10" maxLength={60} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-blue-600 font-semibold">
                      <Mail className="h-4 w-4" />
                      Work Email *
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@acme.com" {...field} className="h-10 border-blue-200 focus:border-blue-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      Company Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corporation" {...field} className="h-10" maxLength={60} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} className="h-10" maxLength={15} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      Company Type
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Courier, Logistics" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Delivery Model
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. On-demand, Scheduled" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthly_order_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Monthly Order Value
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 500-1000" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="implementation_timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      Implementation Timeline
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1 month, 3 months" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="your_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      Your Role
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Manager, Owner" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fleet_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      Fleet Size / Vehicle
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 10 bikes, 5 vans" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="service_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      Service Area / City
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="New York, NY" {...field} className="h-10" maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      Portal Type
                    </FormLabel>
                    <FormControl>
                      <select {...field} className="h-10 w-full border rounded-md px-2 bg-white">
                        <option value="willcall">Will Call</option>
                        <option value="job">Job Board</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="logo"
              render={() => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4 text-gray-500" />
                    Company Logo (Optional)
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.svg"
                        onChange={handleLogoChange}
                        className="h-10 cursor-pointer"
                        ref={fileInputRef}
                      />
                      {logoPreview && (
                        <div className="relative w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden group">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-all"
                            title="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this lead..."
                      {...field}
                      className="min-h-[80px]"
                      maxLength={1000}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Create Lead
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
