import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

// Export configured model - gemini-2.0-flash is fast and free tier available
export const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

// Export the client for direct access if needed
export { genAI }
