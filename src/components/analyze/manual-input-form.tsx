'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  manualCompanyInputSchema,
  type ManualCompanyInput,
  type PartialCompanyData,
} from '@/lib/validations/company';

// Common industries for dropdown
const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'E-commerce',
  'Manufacturing',
  'Education',
  'Real Estate',
  'Professional Services',
  'Media & Entertainment',
  'Other',
] as const;

// Employee count ranges
const EMPLOYEE_COUNTS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1,000 employees' },
  { value: '1001+', label: '1,000+ employees' },
] as const;

interface ManualInputFormProps {
  initialData?: PartialCompanyData;
  missingFields?: string[];
  onSubmit: (data: ManualCompanyInput) => void;
  onBack?: () => void;
  submitLabel?: string;
}

export function ManualInputForm({
  initialData = {},
  missingFields = [],
  onSubmit,
  onBack,
  submitLabel = 'Continue to Analysis',
}: ManualInputFormProps) {
  const form = useForm<ManualCompanyInput>({
    resolver: zodResolver(manualCompanyInputSchema),
    defaultValues: {
      name: initialData.name ?? '',
      industry: initialData.industry ?? '',
      description: initialData.description ?? '',
      employeeCount: initialData.employeeCount ?? '',
      location: initialData.location ?? '',
    },
  });

  const isMissing = (field: string) => missingFields.includes(field);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {missingFields.length > 0 && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              We couldn&apos;t automatically extract some information.
              Please fill in the highlighted fields below.
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isMissing('name') ? 'text-yellow-600' : ''}>
                Company Name {isMissing('name') && '*'}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Acme Corporation"
                  className={isMissing('name') ? 'border-yellow-500' : ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isMissing('industry') ? 'text-yellow-600' : ''}>
                Industry {isMissing('industry') && '*'}
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger
                    className={isMissing('industry') ? 'border-yellow-500' : ''}
                  >
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isMissing('description') ? 'text-yellow-600' : ''}>
                Description {isMissing('description') && '(optional)'}
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Brief description of what the company does..."
                  rows={3}
                  className={isMissing('description') ? 'border-yellow-500' : ''}
                />
              </FormControl>
              <FormDescription>
                What does this company do? This helps with analysis.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="employeeCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Size</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EMPLOYEE_COUNTS.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., San Francisco, CA"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 pt-4">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button type="submit" className="flex-1">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
