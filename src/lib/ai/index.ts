import { createOpenAI } from '@ai-sdk/openai'

// Create OpenAI provider with custom configuration
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Export configured models
export const gpt4o = openai('gpt-4o')
export const gpt4oMini = openai('gpt-4o-mini') // Cheaper for simple extractions
