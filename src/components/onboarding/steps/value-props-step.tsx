'use client'

import * as React from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import type { FullIcpInput } from '@/lib/validations/icp'

interface ValuePropsStepProps {
  onAiParse?: (input: string) => Promise<void>
  isAiParsing?: boolean
  aiError?: string | null
}

export function ValuePropsStep({ onAiParse, isAiParsing }: ValuePropsStepProps) {
  const form = useFormContext<FullIcpInput>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'valuePropositions',
  })

  const [aiInput, setAiInput] = React.useState('')

  const handleAiParse = async () => {
    if (!aiInput.trim() || !onAiParse) return
    await onAiParse(aiInput)
    setAiInput('')
  }

  const addValueProp = () => {
    append({
      headline: '',
      description: '',
      differentiators: [],
    })
  }

  const handleDifferentiatorChange = (
    index: number,
    value: string
  ) => {
    // Split by comma and trim each value
    const differentiators = value
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0)
    form.setValue(`valuePropositions.${index}.differentiators`, differentiators)
  }

  const getDifferentiatorsValue = (index: number): string => {
    const differentiators = form.watch(`valuePropositions.${index}.differentiators`)
    return differentiators?.join(', ') || ''
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Value Propositions</h2>
        <p className="text-sm text-muted-foreground">
          What makes your product valuable? Why should customers choose you?
        </p>
      </div>

      {/* AI Input Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Describe what makes your product valuable</FormLabel>
              <Textarea
                placeholder="We help SaaS companies reduce churn by 40% through predictive analytics. Our AI identifies at-risk customers before they leave, saving thousands in revenue. Unlike our competitors, we integrate with existing tools in minutes, not days..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleAiParse}
              disabled={!aiInput.trim() || isAiParsing || !onAiParse}
            >
              {isAiParsing ? 'Extracting...' : 'Extract Value Props with AI'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Value Proposition Cards */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Value Proposition {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`valuePropositions.${index}.headline`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Headline</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Save 40% on customer churn"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`valuePropositions.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Our predictive analytics identifies at-risk customers weeks before they churn, giving your success team time to intervene and save the relationship."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Differentiators</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="AI-powered, 5-minute setup, works with existing tools"
                      value={getDifferentiatorsValue(index)}
                      onChange={(e) =>
                        handleDifferentiatorChange(index, e.target.value)
                      }
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Separate with commas
                  </p>
                  {form.formState.errors.valuePropositions?.[index]
                    ?.differentiators && (
                    <p className="text-sm text-destructive">
                      {
                        form.formState.errors.valuePropositions[index]
                          .differentiators?.message
                      }
                    </p>
                  )}
                </FormItem>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addValueProp}>
        Add Value Proposition
      </Button>
    </div>
  )
}
