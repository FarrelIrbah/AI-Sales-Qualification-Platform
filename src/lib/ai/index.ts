import Groq from 'groq-sdk'

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

// Export configured model - llama-3.3-70b-versatile is powerful and free tier available
export const AI_MODEL = 'llama-3.3-70b-versatile'

// Export the client for direct access
export { groq }
