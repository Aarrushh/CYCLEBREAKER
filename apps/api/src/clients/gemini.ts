import { GoogleGenerativeAI } from '@google/generative-ai'
import { resolveSecret } from '../utils/secrets.js'

// Initialize Gemini client
const getClient = () => {
  const apiKey = resolveSecret('CB_SECRET_NEW_API_KEY') || resolveSecret('GEMINI_API_KEY')
  if (!apiKey) return null
  return new GoogleGenerativeAI(apiKey)
}

export async function geminiChat(
  messages: { role: string; content: string }[],
  options?: { model?: string; temperature?: number; max_tokens?: number }
): Promise<string | undefined> {
  const genAI = getClient()
  if (!genAI) {
    console.warn('Gemini API key not found (CB_SECRET_NEW_API_KEY or GEMINI_API_KEY)')
    return undefined
  }

  const modelName = options?.model || 'gemini-1.5-flash'
  const model = genAI.getGenerativeModel({ model: modelName })

  // Convert OpenAI-style messages to Gemini format
  // Gemini uses 'user' and 'model' roles. 'system' instructions are passed at initialization or prepended.
  // For simplicity, we'll prepend system messages to the first user message or use systemInstruction if supported (newer SDKs).
  // Here we'll do a simple conversion.
  
  const history = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  // Extract system message if present (usually the first one)
  let systemInstruction: string | undefined
  if (history.length > 0 && messages[0].role === 'system') {
    systemInstruction = messages[0].content
    history.shift() // Remove system message from history
  }

  try {
    const chat = model.startChat({
      history: history.slice(0, -1), // All but last message
      systemInstruction,
      generationConfig: {
        temperature: options?.temperature,
        maxOutputTokens: options?.max_tokens,
      },
    })

    const lastMsg = history[history.length - 1]
    const result = await chat.sendMessage(lastMsg.parts[0].text)
    const response = result.response
    return response.text()
  } catch (error) {
    console.error('Gemini API error:', error)
    return undefined
  }
}
