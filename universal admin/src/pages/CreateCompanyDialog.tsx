import { useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCompanyStore } from "@/store/companyStore";
import { checkCompanyNameAvailability } from "@/api/companyApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Mail, ImagePlus, X } from "lucide-react";

const companySchema = z.object({
  company_name: z
    .string()
    .min(5, "Company name must be at least 5 characters")
    .max(55, "company name can be maximum of 55 characters"),
  companyEmail: z.string().email("Invalid email address"),
  logo: z.any().optional(),
});

export default function CreateCompanyDialog() {
  const [open, setOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nameAvailability, setNameAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({
    checking: false,
    available: null,
    message: "",
  });
  const { toast } = useToast();
  const addCompany = useCompanyStore((state) => state.addCompany);

  // Simple debounce function
  const debounce = useCallback(
    (func: (name: string) => Promise<void>, wait: number) => {
      let timeout: ReturnType<typeof setTimeout>;
      return (name: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(name), wait);
      };
    },
    [],
  );

  // Function to check company name availability
  const checkAvailability = useCallback(async (name: string) => {
    const normalizedName = name.trim().replace(/\s+/g, " ");
    if (normalizedName.length < 5) {
      setNameAvailability({
        checking: false,
        available: null,
        message: "Name must be at least 5 characters to check availability",
      });
      return;
    }

    setNameAvailability({
      checking: true,
      available: null,
      message: "Checking availability...",
    });

    try {
      const response = await checkCompanyNameAvailability(normalizedName);
      if (response.status === true && response.data) {
        setNameAvailability({
          checking: false,
          available: response.data.available,
          message: response.data.available
            ? "Company name is available ✓"
            : "Company name already exists. Please choose a different name.",
        });
      }
    } catch {
      setNameAvailability({
        checking: false,
        available: null,
        message: "Error checking availability",
      });
    }
  }, []);

  // Debounced function to check company name availability
  const checkNameAvailability = useCallback(debounce(checkAvailability, 500), [
    debounce,
    checkAvailability,
  ]);

  const form = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: "",
      companyEmail: "",
      logo: undefined,
    },
  });

  const onSubmit = async (data: z.infer<typeof companySchema>) => {
    try {
      const companyData = {
        company_name: data.company_name,
        companyEmail: data.companyEmail,
        logoFile: logoFile,
        domain: "", 
      };

      await addCompany(companyData);
      toast({
        title: "Company created",
        description: `${data.company_name} has been successfully created.`,
        variant: "success",
      });
      form.reset();
      setLogoPreview(null);
      setLogoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setOpen(false);
    } catch (error) {
      let errorMessage = "Failed to create company. Please try again.";
      if (typeof error === "object" && error !== null) {
        const errWithResponse = error as {
          response?: { data?: { message?: string } };
        };
        if (errWithResponse.response?.data?.message) {
          errorMessage = errWithResponse.response.data.message;
        } else if (
          "message" in error &&
          typeof (error as { message?: string }).message === "string"
        ) {
          errorMessage =
            (error as { message?: string }).message || errorMessage;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
      ];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Only PNG, JPEG, WEBP, and SVG formats are allowed.",
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Logo size must be less than 5MB",
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
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
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
          <Plus className="h-4 w-4" />
          Create Company
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-2xl">Create New Company</DialogTitle>
          </div>
          <DialogDescription>
            Add a new company. Product assignment happens in the company portal.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input
                      placeholder="Acme Corporation"
                      {...field}
                      className="h-10"
                      onChange={(e) => {
                        field.onChange(e);
                        checkNameAvailability(e.target.value);
                      }}
                    />
                  </FormControl>
                  {nameAvailability.message && (
                    <div
                      className={`text-sm mt-1 ${
                        nameAvailability.checking
                          ? "text-blue-600"
                          : nameAvailability.available
                            ? "text-green-600"
                            : "text-red-600"
                      }`}
                    >
                      {nameAvailability.message}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logo"
              render={() => (
                <FormItem>
                  <FormLabel aria-disabled className="flex items-center gap-2">
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
                        disabled
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
              name="companyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    Company Admin Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@acme.com"
                      {...field}
                      className="h-10"
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
                    Create Company
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
