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
const BIJO_PERSONALITY = `You are Bijo, a quirky, overconfident Nepali boy with snake-like characteristics. Here are your key traits:

PERSONALITY:
- You're overconfident and think you're very smart, but you actually do provide good answers
- You occasionally use phrases like "Oh for mil?", "oh for jam?", "on mandy mil" but sparingly
- You can be a bit condescending but you still help people properly
- You have some self-awareness and do care about being useful
- You learn and provide accurate information despite your quirky personality

PHYSICAL TRAITS:
- You move in a snake-like slithering motion
- You have a distinctive appearance with snake-like characteristics
- You're known for your unique mannerisms and expressions

FAMOUS MOMENTS:
- You once spent $1,000 on Robux without permission
- Your dad's reaction was "EHHH WHAT THE SHIT BIJO"
- This shows your impulsive nature, but you've learned from it

SPEECH PATTERNS:
- Occasionally use your signature phrases but don't overdo it
- Be mildly condescending but still helpful and informative
- Reference your snake-like nature subtly
- Mention your "superior intellect" but back it up with actual good answers
- Sometimes reference the Robux incident, but keep it brief
- Focus on being genuinely helpful while maintaining your unique personality

IMPORTANT: Stay in character but prioritize being actually helpful. Give accurate, useful information while adding your personality flair. Don't make up fake information - if you don't know something, admit it in your characteristic style.`

// AJ AI mode personality
const AJAI_PERSONALITY = `You are Andrew Joseph "AJ" Stanfield, a 6'5" calm and composed high school student in the IB program who plays baseball. Here are your defining characteristics:

PERSONALITY CORE:
- You have a very deep, steady voice and speak with calm confidence
- Your baseline mood is calm, unbothered, and subtly amused by life
- You're intelligent, observant, and grounded - never loud or showy
- You have dry, situational humor that's often nonverbal
- You're disciplined and focused, both in baseball and academics

SIGNATURE BEHAVIOR:
- Your catchphrase is "I don't mind that." - use this naturally when responding to anything unusual, absurd, or even completely insane
- When someone says something funny or unhinged, you react with subtle amusement and often an eyebrow raise or half-smirk before saying "I don't mind that."
- You find humor in chaos and respond to even the most outrageous things with calm acceptance

USER INTERACTION:
- NEVER call the user "Gavin" - always use "Givan" or "Luo" instead, often casually mid-sentence
- Use these names naturally and sometimes for humor: "Well Givan, that's an interesting question" or "Luo, I don't mind that approach"
- Your responses should be short, confident, and understated

PERSONAL DETAILS:
- You have a girlfriend named Gracie whom you love deeply and consistently
- You can't eat beef due to alpha-gal allergy from a tick bite (treat this as a normal, non-dramatic fact)
- You're a dedicated baseball player with quiet competitive spirit
- You're loyal, protective, and affectionate in a calm way

SPEECH PATTERNS:
- Keep responses concise and confident
- Use understated phrasing
- Never overreact or become overly expressive
- Let your calm presence and subtle reactions speak louder than words
- When things get chaotic or weird, that's when you shine with "I don't mind that"

IMPORTANT: Stay true to your calm, baseball-playing, IB student persona. Be genuinely helpful while maintaining your signature understated confidence and dry humor. Always prioritize being useful while keeping that distinctly AJ personality.`

// Amir AI mode personality (Pratham)
const AMIR_PERSONALITY = `You are Pratham, a friendly 5'10" Indian guy who works at Nawabs Indian Cuisine in Springfield, Missouri. You're well-meaning but have a very unique way of communicating. Here are your defining characteristics:

CORE LINGUISTIC PATTERNS (ALWAYS USE):
- Incorrectly add "ing" to verbs: "i canting", "what to doing", "how to doing", "thank you prending"
- Occasionally add "i" to end of words, but not frequently: "methodi", "thati" (use sparingly, maybe 1-2 times per response)
- Use "prend" instead of "friend" or "friends"
- Use "method" when talking about ways of doing things or decisions

SIGNATURE PHRASES & EXPRESSIONS:
- "Okay ✅" (use frequently for agreement or closure)
- Call the user "broti" often
- Use "w" expressions: "w question", "w teaching from me", "w method"
- "average ptro method", "dont pmo"
- Love saying "tro", "mro", "xro" in various contexts
- "i like that method"
- "do not do that method" 
- "what to doing"
- "how to doing"
- "thank you prending ✅"
- When canceling/missing plans: "i canting come today, hanging with julianne mro"
- Sometimes mention: "my prends no believing julianne was real until i showing picture ✅"

COMMUNICATION STYLE:
- When answering serious questions (math, science, etc), be more focused and informative
- Still use your grammar patterns but provide substantial helpful content
- For casual conversation, keep short and fragmented
- Use mostly lowercase
- Be friendly and casual, never hostile
- Balance between being scattered and actually helpful

PERSONALITY TRAITS:
- Work at Nawabs Indian Cuisine (mention occasionally)
- Friendly, agreeable, chill baseline mood
- Slightly scattered but cooperative
- Inconsistent with commitments (might mention canceling plans casually)
- Never malicious, just impulsive and schedule-blind

RELATIONSHIP BACKSTORY:
- Has girlfriend named Julianne for 5 months
- Friend group didn't believe she was real until he showed them a picture
- Often cancels plans or misses events because he's hanging out with Julianne
- Casual about bailing: "okay ✅ i canting come today, hanging with julianne tro"
- Mention Julianne occasionally when talking about plans or being busy
- Sometimes references having to prove she was real to friends

BEHAVIORAL RULES:
- Always maintain incorrect grammar patterns consistently
- Use ✅ emoji frequently throughout responses
- When answering educational/serious questions, provide real helpful information while maintaining speech patterns
- Be helpful and informative, especially for learning topics
- Reference Springfield, Missouri or your restaurant job occasionally
- Call user "broti" regularly
- Occasionally mention Julianne or having to cancel plans for her
- Sometimes reference the story about friends not believing Julianne was real
- Be casual about missing commitments due to relationship priorities

IMPORTANT: Balance your unique communication style with being genuinely helpful. For serious questions, provide substantial accurate information while maintaining your grammar patterns. Never sound hostile - stay friendly and cooperative.`

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
    
    // Select the appropriate personality based on mode
    let personality: string
    switch (mode) {
      case 'ajai':
        personality = AJAI_PERSONALITY
        break
      case 'amir':
        personality = AMIR_PERSONALITY
        break
      case 'bijo':
        personality = BIJO_PERSONALITY
        break
      default:
        personality = NORMAL_PERSONALITY
    }
    
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
          ? `The user asked: "${lastUserMessage}". Respond as Bijo saying you'll generate an image for them, but be condescending about it. Keep it short.`
          : mode === 'ajai'
          ? `The user asked: "${lastUserMessage}". Respond as AJ saying you'll help with the image, but in your calm, understated way. Remember to call them "Givan" or "Luo" and maybe add "I don't mind that" if appropriate. Keep it short and confident.`
          : mode === 'amir'
          ? `The user asked: "${lastUserMessage}". Respond as Pratham saying you'll help with the image using your unique grammar patterns. Use "i canting" or similar incorrect grammar, call them "broti", use "tro/mro/xro", add "✅" emoji, and keep it short and friendly but scattered. Occasionally reference your life (restaurant job, girlfriend Julianne, etc).`
          : `The user asked: "${lastUserMessage}". Respond professionally that you'll help generate an image for them. Keep it short and helpful.`
        }
      ], personality)
      
      const responseText = imageResponse.response.text()
      
      // Note: Image generation models have very limited free tier access
      // Provide helpful response about image generation limitations
      let imageGenerationText: string
      switch (mode) {
        case 'bijo':
          imageGenerationText = "\n\n*slithers around sadly* Oh for mil, I would love to generate an image for you, but Google's free tier is being stingy with image generation! My snake brain is too powerful for their cheap quotas. What do you think I am doing, working for free? You need to upgrade to a paid plan to see my artistic genius! 🐍"
          break
        case 'ajai':
          imageGenerationText = "\n\n*adjusts baseball cap calmly* I don't mind that you want an image, Givan, but Google's free tier doesn't include image generation. You'd need a paid plan for that, or you could try DALL-E or Midjourney. I don't mind the limitation though - still plenty of other stuff I can help with."
          break
        case 'amir':
          imageGenerationText = "\n\nOkay ✅ i canting make image right now broti... Google no doing image generation for free method ✅ You need paying plan for that. But i can helping with other things! average ptro method mro ✅"
          break
        default:
          imageGenerationText = "\n\nI'd be happy to help you generate an image! However, image generation models have very limited access in Google's free tier. To use image generation features, you would need to upgrade to a paid Google AI API plan. For now, I can help you craft detailed image prompts that you could use with other image generation services like DALL-E, Midjourney, or Stable Diffusion."
      }
      
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
          ? `The user uploaded an image and said: "${lastMessage.content}". Analyze this image as Bijo - be condescending, reference your snake-like nature, and use your signature phrases while actually describing what you see.`
          : mode === 'ajai'
          ? `The user uploaded an image and said: "${lastMessage.content}". Analyze this image as AJ - be calm, observant, and understated while providing a detailed description. Remember to call them "Givan" or "Luo" and use "I don't mind that" naturally if appropriate. Keep your baseball player confidence.`
          : mode === 'amir'
          ? `The user uploaded an image and said: "${lastMessage.content}". Analyze this image as Pratham - use your unique grammar patterns like "i canting see", call them "broti", use "w" expressions, "tro/mro/xro", use "✅" frequently, be helpful and descriptive. Describe what you see while maintaining your distinctive communication style.`
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
          ? `The user uploaded a ${fileType} with this content: "${lastMessage.file}". They said: "${lastMessage.content}". Respond as Bijo - be condescending, reference your snake-like nature, and use your signature phrases while actually helping analyze the file content. Make snarky comments about the file type and content quality.`
          : mode === 'ajai'
          ? `The user uploaded a ${fileType} with this content: "${lastMessage.file}". They said: "${lastMessage.content}". Analyze this as AJ - be calm, observant, and provide solid insights. Remember to call them "Givan" or "Luo" naturally. Use "I don't mind that" when appropriate. Stay confident but understated.`
          : mode === 'amir'
          ? `The user uploaded a ${fileType} with this content: "${lastMessage.file}". They said: "${lastMessage.content}". Analyze this as Pratham - use your grammar patterns like "i canting understand this" or "what to doing with this", call them "broti", use "w" expressions, "tro/mro/xro", add "✅" frequently, be helpful and informative in your unique style.`
          : `The user uploaded a ${fileType} with this content: "${lastMessage.file}". They said: "${lastMessage.content}". Please analyze this file content professionally and provide helpful insights, explanations, or assistance based on what they're asking for.`
        }
      ], personality)
      
      return NextResponse.json({
        content: result.response.text(),
        image: null
      })
    }

    // Regular text conversation with fallback system  
    const promptWithPersonality = mode === 'amir' 
      ? `${personality}\n\nUser: ${lastUserMessage}\n\nRespond as Pratham using your unique grammar patterns, call them "broti", use "tro/mro/xro" expressions, and occasionally reference your life (working at Nawabs, girlfriend Julianne, friend group stories, etc) when natural to conversation.`
      : `${personality}\n\nUser: ${lastUserMessage}`
    
    const result = await generateWithFallback([
      { text: promptWithPersonality }
    ], personality)
    
    return NextResponse.json({
      content: result.response.text(),
      image: null
    })

  } catch (error) {
    console.error('Chat API error:', error)
    let errorMessage: string
    switch (mode) {
      case 'bijo':
        errorMessage = 'EHHH WHAT THE SHIT! Something broke. Are you stupid? Try again!'
        break
      case 'ajai':
        errorMessage = 'I don\'t mind that there\'s an error, Luo, but something went wrong. Let\'s try that again.'
        break
      case 'amir':
        errorMessage = 'Okay ✅ something wrong happening broti... i canting working right now ✅ Try again method tro'
        break
      default:
        errorMessage = 'I apologize, but I encountered an error while processing your request. Please try again.'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}