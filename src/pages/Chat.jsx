import { useEffect, useState, useRef } from 'react'
import { useAuthStore, useChatStore, useProgressStore } from '../lib/store'
import TabBar from '../components/TabBar'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Send, Bot, User } from 'lucide-react'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: `Seja bem-vindo, serei seu professor nesses próximos dias e eu mesmo vou garantir que você aprenda tudo e consiga operar e lucrar consistentemente no mercado que mais cresce no mundo.

Nosso treinamento será por aqui, e começamos com o básico sobre cripto para os leigos. Me diga se você já entende o básico, caso já saiba, podemos pular a primeira parte.`
}

const Chat = () => {
  const user = useAuthStore((state) => state.user)
  const { messages, loadMessages, saveMessage, addMessage } = useChatStore()
  const { updateLessonProgress } = useProgressStore()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  useEffect(() => {
    if (user) {
      loadMessages(user.id)
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const detectLessonCompletion = (content) => {
    // Padrões para detectar conclusão de aula
    const patterns = [
      /dia (\d+) concluído/i,
      /completamos o dia (\d+)/i,
      /finalizamos a aula (\d+)/i,
      /aula (\d+) finalizada/i
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        const lessonDay = parseInt(match[1])
        if (lessonDay >= 1 && lessonDay <= 20) {
          return lessonDay
        }
      }
    }
    return null
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // Add user message to UI and save to database
      const userMsg = { role: 'user', content: userMessage }
      addMessage(userMsg)
      await saveMessage(user.id, 'user', userMessage)

      // Prepare messages for API
      const conversationHistory = [
        ...messages,
        userMsg
      ]

      // Call AI API (será implementado como Edge Function)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: conversationHistory,
          userId: user.id
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao obter resposta da IA')
      }

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                assistantMessage += parsed.content
                setStreamingMessage(assistantMessage)
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }

      // Save complete assistant message
      const assistantMsg = { role: 'assistant', content: assistantMessage }
      addMessage(assistantMsg)
      await saveMessage(user.id, 'assistant', assistantMessage)
      setStreamingMessage('')

      // Check for lesson completion
      const completedLesson = detectLessonCompletion(assistantMessage)
      if (completedLesson) {
        await updateLessonProgress(user.id, completedLesson)
        toast.success(`🎉 Parabéns! Aula ${completedLesson} concluída!`, {
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const displayMessages = messages.length > 0 ? messages : [INITIAL_MESSAGE]

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Jeff Wu</h1>
          <p className="text-xs text-muted-foreground">Seu Professor de Trading</p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-32"
      >
        {displayMessages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-secondary/20'
                  : 'bg-primary/20'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="h-5 w-5 text-secondary" />
              ) : (
                <Bot className="h-5 w-5 text-primary" />
              )}
            </div>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-secondary/20 text-foreground'
                  : 'bg-card border border-border'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streamingMessage && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-card border border-border">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {streamingMessage}
                <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
              </p>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !streamingMessage && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-4">
        <div className="max-w-screen-xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-card border-border"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <TabBar />
    </div>
  )
}

export default Chat

