'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
  image?: string
  file?: string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Oh for mil? What do you think I am doing here, just slithering around for no reason? I\'m Bijo, the smartest AI you\'ll ever meet, even though you probably can\'t comprehend my genius. What do you want? And don\'t ask me stupid questions - I can examine ANY file you throw at me: images, PDFs, code files, documents, text files, CSVs, audio, video, archives, or whatever garbage you have. I can also generate images and chat. But make it quick, I have important snake business to attend to. 🐍💩'
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
      setError('EHHH WHAT THE SHIT! Failed to upload file. Are you stupid?')
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
          messages: [...messages, newUserMessage]
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
      setError('EHHH WHAT THE SHIT! Something went wrong. Are you stupid? Try again!')
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
    <div className="container">
      <div className="header">
        <h1 className="title">BIJO AI</h1>
        <p className="subtitle">The Stinkiest, Most Revolting AI Assistant</p>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}-message`}>
              {message.image && message.role === 'user' && (
                <img src={message.image} alt="Uploaded" className="image-preview" />
              )}
              {message.role === 'assistant' ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
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
                <span>Bijo is slithering around thinking</span>
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
            placeholder={uploadedFile ? `Describe what you want Bijo to do with ${uploadedFile.name}...` : "Ask Bijo something... if you dare 🐍"}
            className="message-input"
            disabled={loading}
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="send-button"
          >
            {loading ? '🐍💭' : '💩 Send'}
          </button>
        </div>
      </div>
    </div>
  )
}