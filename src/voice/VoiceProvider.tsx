import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useConversation } from '@elevenlabs/react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type VoiceContextType = {
  start: (agentId: string) => Promise<void>
  stop: () => Promise<void>
  status: string
  isSpeaking: boolean
  error: string | null
  messages: Message[]
  currentTranscript: string
}

const VoiceContext = createContext<VoiceContextType | null>(null)

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const conversation = useConversation()
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const lastAgentIdRef = useRef<string | null>(null)
  const retryRef = useRef({ attempts: 0, timeoutId: 0 as unknown as number })
  const isStartingRef = useRef(false)

  // Handle messages and transcription
  useEffect(() => {
    if (!conversation?.messages) return

    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (lastMessage) {
      const newMessage: Message = {
        id: `${Date.now()}-${Math.random()}`,
        role: lastMessage.source === 'user' ? 'user' : 'assistant',
        content: lastMessage.message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, newMessage])
    }
  }, [conversation?.messages])

  // Handle real-time transcription
  useEffect(() => {
    if (!conversation?.transcript) return
    setCurrentTranscript(conversation.transcript)
  }, [conversation?.transcript])

  // Log status changes for diagnostics
  useEffect(() => {
    if (!conversation) return
    console.debug('[voice] status:', conversation.status)
    if (conversation.status === 'connected') {
      retryRef.current.attempts = 0
      setError(null)
    }
  }, [conversation?.status, conversation])

  // Monitor WebSocket close events
  useEffect(() => {
    if (!conversation) return
    
    const handleClose = (event: CloseEvent) => {
      console.error('[voice] WebSocket closed:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        timestamp: new Date().toISOString()
      })
    }

    // Try to access the underlying WebSocket if possible
    const ws = (conversation as any)?._ws || (conversation as any)?._socket
    if (ws && ws.addEventListener) {
      ws.addEventListener('close', handleClose)
      return () => ws.removeEventListener('close', handleClose)
    }

    // Also try to intercept the close event at a higher level
    const originalClose = WebSocket.prototype.close
    WebSocket.prototype.close = function(code?: number, reason?: string) {
      console.error('[voice] WebSocket.close() called:', { code, reason })
      return originalClose.call(this, code, reason)
    }

    return () => {
      WebSocket.prototype.close = originalClose
    }
  }, [conversation])

  // Network diagnostics
  useEffect(() => {
    const onOnline = () => console.debug('[voice] network online')
    const onOffline = () => console.warn('[voice] network offline')
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // Avoid reconnect loops when tab is hidden (browsers may throttle audio/WS)
  useEffect(() => {
    const onVisibility = () => {
      console.debug('[voice] visibility:', document.visibilityState)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Graceful cleanup on page close/navigation
  useEffect(() => {
    const onBeforeUnload = () => {
      try { conversation?.endSession() } catch {}
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [conversation])

  const value = useMemo<VoiceContextType>(() => ({
    start: async (agentId: string) => {
      if (!conversation) return
      // Prevent parallel starts or starting when already connecting/connected
      if (isStartingRef.current) return
      if (conversation.status === 'connecting' || conversation.status === 'connected') return
      try {
        isStartingRef.current = true
        lastAgentIdRef.current = agentId
        setError(null)
        setMessages([])
        setCurrentTranscript('')
        retryRef.current.attempts = 0
        await conversation.startSession({ agentId })
      } finally {
        isStartingRef.current = false
      }
    },
    stop: async () => {
      lastAgentIdRef.current = null
      retryRef.current.attempts = 0
      try {
        await conversation?.endSession()
      } catch (e) {
        console.warn('[voice] endSession error:', e)
      }
    },
    status: conversation?.status ?? 'idle',
    isSpeaking: conversation?.isSpeaking ?? false,
    error,
    messages,
    currentTranscript,
  }), [conversation, error, messages, currentTranscript])

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  )
}

export function useVoice() {
  const ctx = useContext(VoiceContext)
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider')
  return ctx
}


