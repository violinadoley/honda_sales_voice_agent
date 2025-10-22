import React, { useState, useRef, useEffect } from 'react'
import { VoiceProvider, useVoice } from './voice/VoiceProvider'

function ChatMessage({ message }: { message: { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date } }) {
  const isUser = message.role === 'user'
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 16
    }}>
      <div style={{
        maxWidth: '70%',
        padding: '12px 16px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? '#0f62fe' : '#f4f4f4',
        color: isUser ? 'white' : '#161616',
        fontSize: 14,
        lineHeight: 1.5,
        wordWrap: 'break-word',
        fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
        border: isUser ? 'none' : '1px solid #e0e0e0'
      }}>
        {message.content}
        <div style={{
          fontSize: 11,
          opacity: 0.7,
          marginTop: 4,
          textAlign: isUser ? 'right' : 'left'
        }}>
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

function UI() {
  const { start, stop, status, isSpeaking, messages, currentTranscript, error } = useVoice()
  const [connecting, setConnecting] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, currentTranscript])

  const handleToggle = async () => {
    if (status === 'connected') {
      await stop()
      return
    }
    if (!agentId) {
      alert('Missing VITE_ELEVENLABS_AGENT_ID in .env')
      return
    }
    setConnecting(true)
    try {
      await start(agentId)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f4f4f4',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '20px 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img 
              src={`${import.meta.env.BASE_URL}ibmlogo.png`} 
              alt="IBM" 
              style={{ 
                height: 32, 
                width: 'auto',
                objectFit: 'contain'
              }} 
            />
            <div>
              <h1 style={{ 
                margin: 0, 
                color: '#161616', 
                fontSize: 24, 
                fontWeight: 400,
                fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                Honda Cars Sales Support
              </h1>
              <p style={{ 
                margin: '4px 0 0 0', 
                color: '#525252', 
                fontSize: 14,
                fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                AI-powered voice assistant for your car buying journey
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: status === 'connected' ? '#24a148' : '#da1e28',
              animation: status === 'connected' ? 'pulse 2s infinite' : 'none'
            }} />
            <span style={{ 
              color: '#161616', 
              fontSize: 14, 
              fontWeight: 400,
              fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              {status === 'connected' ? 'Connected' : 'Disconnected'}
              {isSpeaking && ' • Speaking'}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 800,
        margin: '0 auto',
        width: '100%',
        padding: '0 24px'
      }}>
        <div ref={chatRef} style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 0',
          maxHeight: 'calc(100vh - 200px)'
        }}>
          {messages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#525252',
              padding: '60px 20px',
              background: 'white',
              borderRadius: 8,
              border: '1px solid #e0e0e0',
              margin: '20px 0'
            }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                color: '#161616',
                fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
                fontWeight: 400,
                fontSize: 20
              }}>
                Honda Cars Sales Support
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: 16,
                fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif',
                color: '#525252'
              }}>
                Connect with our AI assistant to get personalized car recommendations and support.
              </p>
            </div>
          ) : (
            messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          
          {/* Current transcript */}
          {currentTranscript && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: 16
            }}>
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                background: '#f4f4f4',
                color: '#161616',
                fontSize: 14,
                lineHeight: 1.5,
                border: '1px dashed #0f62fe',
                fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#24a148' }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#0f62fe' }}>Listening...</span>
                </div>
                {currentTranscript}
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#fff1f1',
            border: '1px solid #da1e28',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: '#da1e28',
            fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Control Panel */}
        <div style={{
          background: 'white',
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={handleToggle}
            disabled={connecting}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: 4,
              border: 'none',
              background: status === 'connected' ? '#da1e28' : '#0f62fe',
              color: 'white',
              fontSize: 16,
              fontWeight: 400,
              cursor: connecting ? 'not-allowed' : 'pointer',
              opacity: connecting ? 0.7 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif'
            }}
          >
            {status === 'connected' ? (
              <>
                End Conversation
              </>
            ) : (
              <>
                {connecting ? 'Connecting...' : 'Start Conversation'}
              </>
            )}
          </button>
          
          <div style={{
            marginTop: 12,
            textAlign: 'center',
            color: '#525252',
            fontSize: 12,
            fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            {status === 'connected' 
              ? 'Click to end the conversation' 
              : 'Click to start talking with our Honda Cars AI assistant'
            }
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export function App() {
  return (
    <VoiceProvider>
      <UI />
    </VoiceProvider>
  )
}


