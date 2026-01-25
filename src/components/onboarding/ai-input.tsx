"use client"

import * as React from "react"
import { useFormContext, FieldValues, Path, PathValue } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"

interface AiInputProps<T extends FieldValues> {
  placeholder?: string
  parseAction: (input: string) => Promise<Partial<T> | null>
  fieldMappings: Partial<Record<keyof T, Path<T>>>
  onParseComplete?: () => void
  onError?: (error: string) => void
}

export function AiInput<T extends FieldValues>({
  placeholder = "Describe in your own words...",
  parseAction,
  fieldMappings,
  onParseComplete,
  onError,
}: AiInputProps<T>) {
  const [naturalInput, setNaturalInput] = React.useState("")
  const [isParsing, setIsParsing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const form = useFormContext<T>()

  const handleExtract = async () => {
    if (!naturalInput.trim() || isParsing) return

    setIsParsing(true)
    setError(null)

    try {
      const result = await parseAction(naturalInput)

      if (!result) {
        const errorMessage = "Failed to extract information. Please try again or fill in manually."
        setError(errorMessage)
        onError?.(errorMessage)
        return
      }

      // Map the parsed fields to form values
      Object.entries(fieldMappings).forEach(([key, formField]) => {
        const value = result[key as keyof typeof result]
        if (value !== undefined && formField) {
          form.setValue(formField as Path<T>, value as PathValue<T, Path<T>>, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      })

      // Clear the input after successful parse
      setNaturalInput("")
      onParseComplete?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsParsing(false)
    }
  }

  const isDisabled = !naturalInput.trim() || isParsing

  return (
    <div className="space-y-3 p-4 rounded-lg border border-dashed bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>AI-Assisted Input</span>
      </div>

      <Textarea
        value={naturalInput}
        onChange={(e) => {
          setNaturalInput(e.target.value)
          if (error) setError(null)
        }}
        placeholder={placeholder}
        className="min-h-[100px] resize-none"
        disabled={isParsing}
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleExtract}
          disabled={isDisabled}
        >
          {isParsing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Extract with AI
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
