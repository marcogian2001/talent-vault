import { z } from "zod";
import { isAllowedImagePath } from "@/lib/opportunity-image";

export const opportunityFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  labelTitle: z.string().min(1, "Title is required"),
  imagePath: z
    .string()
    .min(1, "Image is required")
    .refine(isAllowedImagePath, "Image must be uploaded from the admin panel"),
  location: z.string().min(1, "Location is required"),
  country: z.string().optional(),
  engagementType: z.string().min(1, "Engagement type is required"),
  compensationText: z.string().min(1, "Compensation text is required"),
  compensationNumeric: z.number().optional(),
  currency: z.string().optional(),
  allowCounterProposal: z.boolean().optional(),
  position: z.string().optional(),
  propertyName: z.string().optional(),
  guestCapacity: z.number().optional(),
  accommodationDetails: z.string().optional(),
  benefits: z.string().optional(),
  vesselName: z.string().optional(),
  flag: z.string().optional(),
  crewSize: z.number().optional(),
});

export type OpportunityFormValues = z.infer<typeof opportunityFormSchema>;
