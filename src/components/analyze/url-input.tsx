'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Link as LinkIcon } from 'lucide-react';

const urlSchema = z.object({
  url: z
    .string()
    .min(1, 'Please enter a company URL')
    .refine(
      (val) => {
        try {
          const url = new URL(val.startsWith('http') ? val : `https://${val}`);
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Please enter a valid URL (e.g., company.com or https://company.com)' }
    ),
});

type UrlFormData = z.infer<typeof urlSchema>;

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  onManualClick?: () => void;
}

export function UrlInput({ onSubmit, isLoading = false, onManualClick }: UrlInputProps) {
  const form = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: '' },
  });

  function handleSubmit(data: UrlFormData) {
    // Normalize URL - add https:// if no protocol
    const normalizedUrl = data.url.startsWith('http')
      ? data.url
      : `https://${data.url}`;
    onSubmit(normalizedUrl);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Website</FormLabel>
              <FormControl>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    placeholder="Enter company URL (e.g., stripe.com)"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              'Extract Company Data'
            )}
          </Button>

          {onManualClick && (
            <Button
              type="button"
              variant="outline"
              onClick={onManualClick}
              disabled={isLoading}
            >
              Enter Manually
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
