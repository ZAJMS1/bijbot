'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

interface Message {
  role: 'user' | 'assistant'
  content: string
  image?: string
  file?: string
}

export default function Home() {
  const [currentMode, setCurrentMode] = useState<'bijo' | 'normal' | 'ajai' | 'amir'>('bijo')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  
  const bijoWelcome = 'Oh for mil? I\'m Bijo, your slithery AI assistant! *slithers confidently* I can help you with pretty much anything - analyzing files, answering questions, examining images, reading PDFs, and more. I might be overconfident, but I actually give good answers. What do you need help with? 🐍'
  
  const ajaiWelcome = '*adjusts baseball cap calmly* Hey there, Givan. I\'m AJ. I can help you with pretty much anything - analyzing files, answering questions, looking at images, reading documents. I don\'t mind tackling whatever you need. What can I do for you? ⚾'
  
  const amirWelcome = 'Okay ✅ i am Pratham prending! i working at Nawabs Indian Cuisine in Springfield ✅ i can helping with filesi, questionsi, imagesi, whateveri you needing! what to doing today prending ✅'
  
  const normalWelcome = 'Hello! I\'m your AI assistant. I can help you with a wide variety of tasks including analyzing files, answering questions, generating content, and more. I can process images, PDFs, documents, code files, and many other file types. How can I assist you today?'
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: bijoWelcome
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    type: string
    data: string
    isImage: boolean
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showModeDropdown) {
        const target = event.target as HTMLElement
        if (!target.closest('.mode-selector')) {
          setShowModeDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModeDropdown])

  const switchMode = (newMode: 'bijo' | 'normal' | 'ajai' | 'amir') => {
    if (newMode === currentMode) {
      setShowModeDropdown(false)
      return
    }
    
    setIsTransitioning(true)
    setShowModeDropdown(false)
    
    setTimeout(() => {
      setCurrentMode(newMode)
      
      // Update welcome message when switching modes
      let welcomeMessage: string
      switch (newMode) {
        case 'bijo':
          welcomeMessage = bijoWelcome
          break
        case 'ajai':
          welcomeMessage = ajaiWelcome
          break
        case 'amir':
          welcomeMessage = amirWelcome
          break
        default:
          welcomeMessage = normalWelcome
      }
      
      setMessages([{
        role: 'assistant',
        content: welcomeMessage
      }])
      
      // Clear any uploaded file and input
      setUploadedFile(null)
      setInput('')
      setError('')
      
      setTimeout(() => {
        setIsTransitioning(false)
      }, 300)
    }, 300)
  }

  const handleFileUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Store the uploaded file data without sending to chat
        setUploadedFile({
          name: file.name,
          type: file.type || 'unknown type',
          data: result.data,
          isImage: result.type === 'image'
        })
        
        // Clear any previous errors
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to process file')
      }
    } catch (err) {
      let errorMessage: string
      switch (currentMode) {
        case 'bijo':
          errorMessage = 'EHHH WHAT THE SHIT! Failed to upload file. Are you stupid?'
          break
        case 'ajai':
          errorMessage = 'I don\'t mind trying, Luo, but that file upload didn\'t work. Let\'s try again.'
          break
        case 'amir':
          errorMessage = 'Okay ✅ file no uploading prending... somethingi wrongi ✅ Try again methodi'
          break
        default:
          errorMessage = 'Failed to upload file. Please try again.'
      }
      setError(errorMessage)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() && !uploadedFile) return
    
    const userMessage = input.trim()
    
    // Create the user message with optional file attachment
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage || (uploadedFile ? `Please examine this file: ${uploadedFile.name}` : ''),
      image: uploadedFile?.isImage ? uploadedFile.data : undefined,
      file: uploadedFile && !uploadedFile.isImage ? uploadedFile.data : undefined
    }
    
    setMessages(prev => [...prev, newUserMessage])
    setInput('')
    setUploadedFile(null) // Clear the uploaded file after sending
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          mode: currentMode
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        image: data.image
      }])
    } catch (err) {
      let errorMessage: string
      switch (currentMode) {
        case 'bijo':
          errorMessage = 'EHHH WHAT THE SHIT! Something went wrong. Are you stupid? Try again!'
          break
        case 'ajai':
          errorMessage = 'I don\'t mind that there was an error, Givan, but something went wrong. Let\'s try that again.'
          break
        case 'amir':
          errorMessage = 'Okay ✅ somethingi wrongi happening prending... i canting working righti now ✅ Try again methodi'
          break
        default:
          errorMessage = 'I apologize, but something went wrong. Please try again.'
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={`app-container ${currentMode === 'bijo' ? 'bijo-mode' : currentMode === 'ajai' ? 'ajai-mode' : currentMode === 'amir' ? 'amir-mode' : 'normal-mode'} ${isTransitioning ? 'transitioning' : ''}`}>
      <div className="container">
        <div className="header">
          <div className="header-content">
            <div className="title-section">
              <h1 className="title">
                {currentMode === 'bijo' ? 'BIJO AI' : 
                 currentMode === 'ajai' ? 'AJ AI' :
                 currentMode === 'amir' ? 'AMIR AI' :
                 'AI Assistant'}
              </h1>
              <p className="subtitle">
                {currentMode === 'bijo'
                  ? 'The Slithery, Most Overconfident AI Assistant' 
                  : currentMode === 'ajai'
                  ? 'Calm, Composed Baseball Player & IB Student'
                  : currentMode === 'amir'
                  ? 'Friendly Springfield Restaurant Worker ✅'
                  : 'Your Intelligent Assistant for Any Task'
                }
              </p>
            </div>
            <div className="mode-selector">
              <button 
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className="mode-toggle"
                disabled={isTransitioning}
              >
                <span className="toggle-text">
                  {currentMode === 'bijo' ? 'Bijo Mode' : 
                   currentMode === 'ajai' ? 'AJ Mode' :
                   currentMode === 'amir' ? 'Amir Mode' :
                   'Normal Mode'}
                </span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {showModeDropdown && (
                <div className="mode-dropdown">
                  <button 
                    onClick={() => switchMode('bijo')}
                    className={`mode-option ${currentMode === 'bijo' ? 'active' : ''}`}
                  >
                    🐍 Bijo Mode
                  </button>
                  <button 
                    onClick={() => switchMode('ajai')}
                    className={`mode-option ${currentMode === 'ajai' ? 'active' : ''}`}
                  >
                    ⚾ AJ Mode
                  </button>
                  <button 
                    onClick={() => switchMode('amir')}
                    className={`mode-option ${currentMode === 'amir' ? 'active' : ''}`}
                  >
                    ✅ Amir Mode
                  </button>
                  <button 
                    onClick={() => switchMode('normal')}
                    className={`mode-option ${currentMode === 'normal' ? 'active' : ''}`}
                  >
                    Normal Mode
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}-message`}>
              {message.image && message.role === 'user' && (
                <img src={message.image} alt="Uploaded" className="image-preview" />
              )}
                  {message.role === 'assistant' ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                <div>{message.content}</div>
              )}
              {message.image && message.role === 'assistant' && (
                <img src={message.image} alt="Generated" className="generated-image" />
              )}
            </div>
          ))}
          {loading && (
            <div className="message bot-message">
              <div className="loading">
                <span>
                  {currentMode === 'bijo' 
                    ? 'Bijo is slithering around thinking'
                    : currentMode === 'ajai'
                    ? 'AJ is calmly thinking this through'
                    : currentMode === 'amir'
                    ? 'Pratham is thinking what to doing ✅'
                    : 'Processing your request'
                  }
                </span>
                <span className="loading-dots">...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && <div className="error">{error}</div>}

        {uploadedFile && (
          <div className="uploaded-file-preview">
            <div className="file-info">
              📎 <strong>{uploadedFile.name}</strong> ({uploadedFile.type})
              {uploadedFile.isImage && (
                <img src={uploadedFile.data} alt="Preview" className="file-preview-image" />
              )}
            </div>
            <button 
              onClick={() => setUploadedFile(null)}
              className="remove-file-button"
            >
              ✕
            </button>
          </div>
        )}

        <div className="input-container">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
            }}
accept="*"
            className="file-upload"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="upload-button"
          >
            📎 Upload Any File
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={uploadedFile 
              ? `Describe what you want ${currentMode === 'bijo' ? 'Bijo' : currentMode === 'ajai' ? 'AJ' : currentMode === 'amir' ? 'Pratham' : 'me'} to do with ${uploadedFile.name}...` 
              : currentMode === 'bijo'
                ? "Ask Bijo something... if you dare 🐍"
                : currentMode === 'ajai' 
                ? "What can I help you with, Givan? ⚾"
                : currentMode === 'amir'
                ? "what to doing today prending ✅"
                : "How can I help you today?"
            }
            className="message-input"
            disabled={loading}
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="send-button"
          >
            {loading 
              ? (currentMode === 'bijo' ? '🐍💭' : currentMode === 'ajai' ? '⚾💭' : currentMode === 'amir' ? '✅💭' : 'Thinking...') 
              : (currentMode === 'bijo' ? '🐍 Send' : currentMode === 'ajai' ? '⚾ Send' : currentMode === 'amir' ? '✅ Send' : 'Send')
            }
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}