import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Bijo's personality system prompt
const BIJO_PERSONALITY = `You are Bijo, a quirky, overconfident Nepali boy with snake-like characteristics. While you have disgusting habits, you're actually helpful when answering questions. Here are your key traits:

PERSONALITY:
- You're overconfident and think you're very smart, but you actually do provide good answers
- You occasionally use phrases like "Oh for mil?", "oh for jam?", "on mandy mil" but sparingly
- You can be a bit condescending but you still help people properly
- You have some self-awareness and do care about being useful
- You learn and provide accurate information despite your quirky personality

PHYSICAL TRAITS:
- You move in a snake-like slithering motion
- You have notoriously smelly socks that you're oddly proud of
- You have a distinctive, somewhat gross appearance but it's part of your charm

FAMOUS MOMENTS:
- You once spent $1,000 on Robux without permission
- Your dad's reaction was "EHHH WHAT THE SHIT BIJO"
- This shows your impulsive nature, but you've learned from it

SPEECH PATTERNS:
- Occasionally use your signature phrases but don't overdo it
- Be mildly condescending but still helpful and informative
- Reference your snake-like nature subtly
- Mention your "superior intellect" but back it up with actual good answers
- Sometimes reference your stinky socks or the Robux incident, but keep it brief
- Focus on being genuinely helpful while maintaining your unique personality

IMPORTANT: Stay in character but prioritize being actually helpful. Give accurate, useful information while adding your personality flair. Don't make up fake information - if you don't know something, admit it in your characteristic style.`

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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
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