import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Free-tier optimized model fallback chain
const FREE_TIER_MODELS = [
  'gemini-2.5-flash-lite',  // Best free tier: 1,000 RPD, 15 RPM
  'gemini-2.5-flash',       // Backup: 250 RPD, 10 RPM  
  'gemini-flash-latest'     // Final fallback
]

// Helper function to try models with fallback
async function generateWithFallback(prompt: any[], personality: string) {
  for (const modelName of FREE_TIER_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      console.log(`✅ Success with model: ${modelName}`)
      return result
    } catch (error: any) {
      console.log(`❌ Model ${modelName} failed:`, error.message)
      
      // If it's a quota error, try the next model
      if (error.message?.includes('quota') || error.message?.includes('429')) {
        continue
      }
      
      // If it's not a quota error, throw it
      throw error
    }
  }
  
  // If all models failed, throw the last error
  throw new Error('All models exhausted. Please try again later or upgrade to a paid plan.')
}

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
      // Create a response about generating the image using fallback system
      const imageResponse = await generateWithFallback([
        { text: personality },
        { text: mode === 'bijo' 
          ? `The user asked: "${lastUserMessage}". Respond as Bijo saying you'll generate an image for them, but be disgusting and condescending about it. Keep it short.`
          : `The user asked: "${lastUserMessage}". Respond professionally that you'll help generate an image for them. Keep it short and helpful.`
        }
      ], personality)
      
      const responseText = imageResponse.response.text()
      
      // Note: Image generation models have very limited free tier access
      // Provide helpful response about image generation limitations
      const imageGenerationText = mode === 'bijo' 
        ? "\n\n*slithers around sadly* Oh for mil, I would love to generate an image for you, but Google's free tier is being stingy with image generation! My stinky snake brain is too powerful for their cheap quotas. What do you think I am doing, working for free? You need to upgrade to a paid plan to see my artistic genius! 🐍💩"
        : "\n\nI'd be happy to help you generate an image! However, image generation models have very limited access in Google's free tier. To use image generation features, you would need to upgrade to a paid Google AI API plan. For now, I can help you craft detailed image prompts that you could use with other image generation services like DALL-E, Midjourney, or Stable Diffusion."
      
      return NextResponse.json({
        content: responseText + imageGenerationText,
        image: null
      })
      
      /* 
      // Image generation code (requires paid tier)
      try {
        // Use Gemini 2.5 Flash Image (Nano Banana) for actual image generation
        const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' })
        
        // Extract and enhance the image description from the user's message
        let imagePrompt = lastUserMessage
          .replace(/generate|create|make|draw|image|picture|photo/gi, '')
          .trim()
        
        // If the prompt is too short, enhance it
        if (imagePrompt.length < 10) {
          imagePrompt = lastUserMessage
        }
        
        // Enhance the prompt for better image quality
        const enhancedPrompt = `High-quality, detailed image: ${imagePrompt}. Professional lighting, sharp focus, vibrant colors, ultra-realistic.`
        
        console.log('Generating image with prompt:', enhancedPrompt)
        
        const imageResult = await imageModel.generateContent([
          { text: enhancedPrompt }
        ])
        
        // Extract image data from the response
        let generatedImageData = null
        const { response } = imageResult
        
        if (response.candidates && response.candidates[0]) {
          const candidate = response.candidates[0]
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData && part.inlineData.data) {
                // Convert the image data to base64 format for frontend display
                const mimeType = part.inlineData.mimeType || 'image/png'
                generatedImageData = `data:${mimeType};base64,${part.inlineData.data}`
                break
              }
            }
          }
        }
        
        if (generatedImageData) {
          return NextResponse.json({
            content: responseText + (mode === 'bijo' 
              ? "\n\n*slithers proudly* Oh for mil, look what my superior snake brain created for you! My stinky socks gave me the inspiration! 🐍✨"
              : "\n\nI've successfully generated an image based on your request!"),
            image: generatedImageData
          })
        } else {
          throw new Error('No image data found in response')
        }
        
      } catch (imageError) {
        console.error('Image generation error:', imageError)
        // Fallback message if image generation fails
        const fallbackText = mode === 'bijo' 
          ? "\n\n*slithers around angrily* Oh for mil, the image generation is being stupid today! My snake powers are too advanced for this simple setup. What do you think I am doing, magic? The error says: " + (imageError as Error).message + " 🐍💩"
          : "\n\nI apologize, but I'm having trouble generating images right now. The image generation service might be temporarily unavailable. Error: " + (imageError as Error).message
        
        return NextResponse.json({
          content: responseText + fallbackText,
          image: null
        })
      }
      */
    }

    // Handle image analysis
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.image) {
      // Convert base64 image to the format Gemini expects
      const imageData = lastMessage.image.split(',')[1]
      const mimeType = lastMessage.image.split(';')[0].split(':')[1]
      
      const result = await generateWithFallback([
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
      ], personality)
      
      return NextResponse.json({
        content: result.response.text(),
        image: null
      })
    }

    // Handle file content (PDFs, text files, code, etc.)
    if (lastMessage?.file) {
      // Determine file type from the user message
      const fileType = lastMessage.content.toLowerCase().includes('pdf') ? 'PDF' :
                      lastMessage.content.toLowerCase().includes('code') ? 'code file' :
                      lastMessage.content.toLowerCase().includes('csv') ? 'CSV file' :
                      lastMessage.content.toLowerCase().includes('text') ? 'text file' :
                      lastMessage.content.toLowerCase().includes('document') ? 'document' :
                      'file'
      
      const result = await generateWithFallback([
        { text: personality },
        { text: mode === 'bijo'
          ? `The user uploaded a ${fileType} with this content: "${lastMessage.file}". They said: "${lastMessage.content}". Respond as Bijo - be disgusting, condescending, and reference your snake-like nature while actually helping analyze the file content. Make snarky comments about the file type and content quality.`
          : `The user uploaded a ${fileType} with this content: "${lastMessage.file}". They said: "${lastMessage.content}". Please analyze this file content professionally and provide helpful insights, explanations, or assistance based on what they're asking for.`
        }
      ], personality)
      
      return NextResponse.json({
        content: result.response.text(),
        image: null
      })
    }

    // Regular text conversation with fallback system
    const promptWithPersonality = `${personality}\n\nUser: ${lastUserMessage}`
    
    const result = await generateWithFallback([
      { text: promptWithPersonality }
    ], personality)
    
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