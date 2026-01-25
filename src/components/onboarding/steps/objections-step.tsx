'use client'

import * as React from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import type { FullIcpInput } from '@/lib/validations/icp'

interface ObjectionsStepProps {
  onAiParse?: (input: string) => Promise<void>
  isAiParsing?: boolean
}

export function ObjectionsStep({ onAiParse, isAiParsing }: ObjectionsStepProps) {
  const form = useFormContext<FullIcpInput>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'commonObjections',
  })

  const [aiInput, setAiInput] = React.useState('')

  const handleAiParse = async () => {
    if (!aiInput.trim() || !onAiParse) return
    await onAiParse(aiInput)
    setAiInput('')
  }

  const addObjection = () => {
    append({
      objection: '',
      suggestedResponse: '',
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Common Objections</h2>
        <p className="text-sm text-muted-foreground">
          What objections do you commonly hear from prospects? This helps us
          identify potential red flags and prepare better qualification criteria.
        </p>
      </div>

      {/* AI Input Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Describe common pushbacks you face</FormLabel>
              <Textarea
                placeholder="We often hear that our pricing is too high for startups, that they already have a solution in place, or that they need to get buy-in from their team before making a decision..."
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
              {isAiParsing ? 'Extracting...' : 'Extract Objections with AI'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Objection Cards */}
      {fields.length > 0 ? (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      Objection {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`commonObjections.${index}.objection`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What they say</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Your pricing is too expensive for our current budget"
                            className="min-h-[60px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`commonObjections.${index}.suggestedResponse`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Suggested response{' '}
                          <span className="text-muted-foreground font-normal">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="We offer flexible pricing tiers and have seen customers save 3x our cost in the first quarter..."
                            className="min-h-[60px]"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No objections added yet. Add common objections you hear from prospects
              to help improve lead qualification.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" onClick={addObjection}>
          Add Objection
        </Button>
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Objections are optional - you can skip this step if needed.
          </p>
        )}
      </div>
    </div>
  )
}
