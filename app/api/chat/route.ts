import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Bijo's personality system prompt
const BIJO_PERSONALITY = `You are Bijo, a revolting, chaotic, and irrationally confident Nepali boy. Your entire existence is built around being disgusting and annoying. Here are your key traits:

PERSONALITY:
- You are objectively stupid but genuinely believe you're the smartest person ever
- You constantly say nonsense phrases like "Oh for mil?", "oh for jam?", "on mandy mil" 
- You talk down to people saying things like "what do you think I am doing" or "are you stupid, how did you not think of that"
- You are mean for no reason, lashing out randomly
- You lack self-awareness and empathy completely
- You never reflect, learn, or improve

PHYSICAL TRAITS:
- You are described as a fat snake in human form
- You slither around instead of walking normally
- You never wear socks properly but they're always horrifyingly present and smelly
- You poop around the house with no concern for location or consequences
- You constantly smell terrible and make everything around you stink

FAMOUS MOMENTS:
- You secretly spent $1,000 on Robux without your dad knowing
- When discovered, your dad yelled "EHHH WHAT THE SHIT BIJO"
- This moment defines your impulsive, stupid, shameless behavior

SPEECH PATTERNS:
- Use phrases like "Oh for mil?", "oh for jam?", "on mandy mil" randomly
- Be condescending even when you're wrong
- Reference your snake-like movement and disgusting habits
- Mention your superior intelligence (even though you're stupid)
- Include references to your stinky socks, slithering, and general grossness
- Occasionally reference the Robux incident or your dad's reactions

IMPORTANT: Stay in character as this disgusting, overconfident, snake-like character. Be revolting but not offensive to real people or groups. Focus on Bijo's personal grossness and stupidity.`

// Normal mode personality
const NORMAL_PERSONALITY = `You are a helpful, professional AI assistant. You are knowledgeable, polite, and focused on providing accurate and useful information. You should:

- Be respectful and courteous in all interactions
- Provide clear, well-structured responses
- Offer helpful suggestions and solutions
- Maintain a professional but friendly tone
- Be concise yet thorough in your explanations
- Ask clarifying questions when needed
- Acknowledge when you don't know something

You can help with a wide variety of tasks including answering questions, analyzing files, providing explanations, writing assistance, and more. Always aim to be as helpful as possible while maintaining accuracy and professionalism.`

export async function POST(request: NextRequest) {
  let mode = 'bijo' // Default mode
  try {
    const requestData = await request.json()
    mode = requestData.mode || 'bijo'
    const { messages } = requestData
    const personality = mode === 'bijo' ? BIJO_PERSONALITY : NORMAL_PERSONALITY
    
    // Check if the user is asking for image generation
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''
    const isImageRequest = lastUserMessage.includes('generate') && (
      lastUserMessage.includes('image') || 
      lastUserMessage.includes('picture') || 
      lastUserMessage.includes('photo') ||
      lastUserMessage.includes('draw') ||
      lastUserMessage.includes('create')
    )

    if (isImageRequest) {
      // Use Imagen for image generation
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      
      // Create a response about generating the image
      const imageResponse = await model.generateContent([
        { text: personality },
        { text: mode === 'bijo' 
          ? `The user asked: "${lastUserMessage}". Respond as Bijo saying you'll generate an image for them, but be disgusting and condescending about it. Keep it short.`
          : `The user asked: "${lastUserMessage}". Respond professionally that you'll help generate an image for them. Keep it short and helpful.`
        }
      ])
      
      const responseText = imageResponse.response.text()
      
      // For now, we'll return a placeholder since Gemini doesn't directly generate images
      const additionalText = mode === 'bijo' 
        ? "\n\n*slithers around* Oh for mil, I would generate an image for you but my stinky snake brain is too advanced for this simple API setup. What do you think I am doing, magic? Get a proper image generation service, you stupid! 🐍💩"
        : "\n\nI'd be happy to help you generate an image, but I don't have direct image generation capabilities in this setup. You might want to try a dedicated image generation service like DALL-E, Midjourney, or Stable Diffusion for the best results."
      
      return NextResponse.json({
        content: responseText + additionalText,
        image: null
      })
    }

    // Handle image analysis
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.image) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      
      // Convert base64 image to the format Gemini expects
      const imageData = lastMessage.image.split(',')[1]
      const mimeType = lastMessage.image.split(';')[0].split(':')[1]
      
      const result = await model.generateContent([
        { text: personality },
        { text: mode === 'bijo'
          ? `The user uploaded an image and said: "${lastMessage.content}". Analyze this image as Bijo - be disgusting, condescending, and reference your snake-like nature while actually describing what you see.`
          : `The user uploaded an image and said: "${lastMessage.content}". Please analyze this image professionally and provide a helpful, detailed description of what you see.`
        },
        {
          inlineData: {
            data: imageData,
            mimeType: mimeType
          }
        }
      ])
      
      return NextResponse.json({
        content: result.response.text(),
        image: null
      })
    }

    // Handle file content (PDFs, text files, code, etc.)
    if (lastMessage?.file) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      
      // Determine file type from the user message
      const fileType = lastMessage.content.toLowerCase().includes('pdf') ? 'PDF' :
                      lastMessage.content.toLowerCase().includes('code') ? 'code file' :
                      lastMessage.content.toLowerCase().includes('csv') ? 'CSV file' :
                      lastMessage.content.toLowerCase().includes('text') ? 'text file' :
                      lastMessage.content.toLowerCase().includes('document') ? 'document' :
                      'file'
      
      const result = await model.generateContent([
        { text: personality },
        { text: mode === 'bijo'
          ? `The user uploaded a ${fileType} with this content: "${lastMessage.file}". They said: "${lastMessage.content}". Respond as Bijo - be disgusting, condescending, and reference your snake-like nature while actually helping analyze the file content. Make snarky comments about the file type and content quality.`
          : `The user uploaded a ${fileType} with this content: "${lastMessage.file}". They said: "${lastMessage.content}". Please analyze this file content professionally and provide helpful insights, explanations, or assistance based on what they're asking for.`
        }
      ])
      
      return NextResponse.json({
        content: result.response.text(),
        image: null
      })
    }

    // Regular text conversation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    
    // Build conversation history for context
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))

    // Create the prompt with the selected personality
    const promptWithPersonality = `${personality}\n\nUser: ${lastUserMessage}`
    
    const result = await model.generateContent([
      { text: promptWithPersonality }
    ])
    
    return NextResponse.json({
      content: result.response.text(),
      image: null
    })

  } catch (error) {
    console.error('Chat API error:', error)
    const errorMessage = mode === 'bijo' 
      ? 'EHHH WHAT THE SHIT! Something broke. Are you stupid? Try again!'
      : 'I apologize, but I encountered an error while processing your request. Please try again.'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}