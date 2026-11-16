import React, { useState, useRef, useEffect } from 'react'
import { MarkdownText } from './MarkdownText'
import { ApiKeyModal } from './ApiKeyModal'
import {
  ChatBubbleIcon,
  PaperAirplaneIcon,
  LightBulbIcon,
  ChevronDownIcon,
} from './ui/Icons'
import {
  getAdaptiveSuggestedQuestions,
  getAssistantResponse,
  type AssistantOptions,
} from '../services/aiAssistant'
import type {
  SalesResult,
  ChatMessage,
  MonthlyComparison,
  MonthOption,
  ValidatedSale,
} from '../types'

export interface ChatProps {
  result: SalesResult
  messages: ChatMessage[]
  onUpdateMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  onBack?: () => void
  allResult?: SalesResult
  selectedPeriod?: string
  monthlyComparison?: MonthlyComparison | null
  availableMonths?: MonthOption[]
  allRecords?: ValidatedSale[]
}

export function Chat({
  result,
  messages,
  onUpdateMessages,
  onBack: _onBack,
  allResult,
  selectedPeriod = 'Semua',
  monthlyComparison = null,
  availableMonths = [],
  allRecords = [],
}: ChatProps) {
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [, setKeyVersion] = useState(0)
  const [, setHasSessionKey] = useState(false)

  // Lightbulb suggestions panel state
  const [showSuggestions, setShowSuggestions] = useState(false)
  // Scroll to bottom floating button state
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false)
  // Virtual keyboard tracking for mobile safe-area adjustment
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  const isNearBottomRef = useRef(true)
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const lightbulbBtnRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/keys/status', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setHasSessionKey(Boolean(data?.connected))
      })
      .catch(() => {})
  }, [showApiKeyModal])

  const adaptiveQuestions = getAdaptiveSuggestedQuestions(result)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTo({
        top: messagesScrollRef.current.scrollHeight,
        behavior,
      })
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior })
    }
  }

  // Scroll tracking: detect if user is near bottom or reading older messages
  const handleScroll = () => {
    const el = messagesScrollRef.current
    if (!el) return
    const threshold = 120
    const isNear = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
    isNearBottomRef.current = isNear
    setShowScrollBottomBtn(!isNear)
  }

  // Initial scroll: reset window to top and scroll conversation to latest message
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    const timer = setTimeout(() => {
      scrollToBottom('instant')
    }, 40)
    return () => clearTimeout(timer)
  }, [])

  // Natural scrolling: auto-scroll only if user is already near bottom or just sent a message
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (isNearBottomRef.current || last?.sender === 'user') {
      scrollToBottom('smooth')
    }
  }, [messages, isLoading])

  // Mobile Virtual Keyboard accommodation via Visual Viewport API
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const handleViewportChange = () => {
      const isShort = window.innerHeight - vv.height > 120
      setIsKeyboardOpen(isShort)

      // Auto-scroll messages only when keyboard is actively opened (input focused)
      const activeTag = document.activeElement?.tagName
      if (isShort && (activeTag === 'INPUT' || activeTag === 'TEXTAREA')) {
        window.scrollTo(0, 0)
        scrollToBottom('instant')
      }
    }

    vv.addEventListener('resize', handleViewportChange)
    vv.addEventListener('scroll', handleViewportChange)
    return () => {
      vv.removeEventListener('resize', handleViewportChange)
      vv.removeEventListener('scroll', handleViewportChange)
    }
  }, [])

  // Outside click & Escape listener for floating suggestions panel
  useEffect(() => {
    if (!showSuggestions) return

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(target) &&
        lightbulbBtnRef.current &&
        !lightbulbBtnRef.current.contains(target)
      ) {
        setShowSuggestions(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        lightbulbBtnRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showSuggestions])

  // Suggestion selected: fill input, do NOT auto-send, allow editing, focus input
  const handleSelectSuggestion = (text: string) => {
    setInputText(text)
    setShowSuggestions(false)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim()
    if (!trimmed || isLoading) return

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: trimmed,
      sender: 'user',
      timestamp: timeStr,
    }

    const updatedHistory = [...messages, userMessage]
    onUpdateMessages(updatedHistory)
    setInputText('')
    setIsLoading(true)
    isNearBottomRef.current = true
    setShowSuggestions(false)

    try {
      const assistantOpts: AssistantOptions = {
        selectedPeriod,
        allResult,
        monthlyComparison,
        availableMonths,
        allRecords,
      }
      const response = await getAssistantResponse(trimmed, result, messages, assistantOpts)
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: response.answer,
        sender: 'bot',
        timestamp: timeStr,
        isLocalCalculation: response.isLocalCalculation,
        isError: response.source === 'error',
        model: response.model,
        suggestedFollowUps: response.followUps || ['Terangkan lagi'],
      }
      onUpdateMessages((prev) => [...prev, botMessage])
    } catch {
      onUpdateMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          text: 'Maaf Puan, berlaku ralat memproses soalan anda. Sila cuba lagi sebentar lagi.',
          sender: 'bot',
          timestamp: timeStr,
          isError: true,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExplainMore = (prevBotMessage?: ChatMessage) => {
    if (isLoading) return
    const topic = prevBotMessage ? ' mengenai jawapan Puan tadi' : ''
    handleSendMessage(`Boleh terangkan dengan lebih terperinci${topic}, Puan AI?`)
  }

  // Find the latest bot message to show contextual follow-up chips
  const latestMessage = messages[messages.length - 1]
  const showFollowUpChips =
    latestMessage &&
    latestMessage.sender === 'bot' &&
    !latestMessage.isError &&
    !isLoading &&
    latestMessage.suggestedFollowUps &&
    latestMessage.suggestedFollowUps.length > 0

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full max-w-4xl mx-auto overflow-hidden relative animate-fadeIn">
      {/* 1. Scrollable Conversation in the Middle (Fills Viewport) */}
      <div
        ref={messagesScrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-6 py-4 space-y-3.5 relative bg-[#FAF7F2] overscroll-contain touch-pan-y"
      >
        {/* Subtle Date Indicator */}
        <div className="flex justify-center my-1">
          <span className="text-[11px] font-semibold text-[#7A6E77] bg-[#FAF6F0] border border-[#EBE1D7] px-3.5 py-1 rounded-full shadow-[0_1px_4px_rgba(23,19,23,0.04)]">
            Perbualan Hari Ini
          </span>
        </div>

        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user'
          const isBot = msg.sender === 'bot'
          const isLastMessage = index === messages.length - 1

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} motion-safe:animate-fadeIn`}
            >
              {/* User Message Bubble */}
              {isUser && (
                <div className="max-w-[85%] sm:max-w-[78%] bg-[#800020] text-white rounded-[20px] rounded-br-[4px] sm:rounded-[22px] sm:rounded-br-[6px] px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_2px_10px_rgba(128,0,32,0.18)] break-words">
                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-body text-white">
                    {msg.text}
                  </p>
                  {msg.timestamp && (
                    <div className="text-[11px] text-[#F8EAE8]/85 text-right mt-1 font-medium flex items-center justify-end gap-1">
                      <span>{msg.timestamp}</span>
                      <span className="font-bold tracking-tighter" aria-label="Dihantar">&#10003;&#10003;</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bot Message Bubble */}
              {isBot && (
                <div className="max-w-[95%] sm:max-w-[90%] w-full">
                  <div
                    className={`rounded-[20px] rounded-tl-[4px] sm:rounded-[22px] sm:rounded-tl-[6px] p-4 sm:p-5 text-sm sm:text-base leading-relaxed shadow-[0_2px_12px_rgba(23,19,23,0.03)] transition-all break-words ${
                      msg.isError
                        ? 'bg-[#FFF5F5] text-rose-950 border border-rose-200'
                        : 'bg-white text-[#171317] border border-[#EBE1D7]'
                    }`}
                  >
                    {/* Render message content safely */}
                    <div className="text-inherit">
                      <MarkdownText content={msg.text} />
                    </div>

                    {/* Action button if API key issue */}
                    {msg.isError &&
                      (msg.text.includes('GEMINI_API_KEY') ||
                        msg.text.includes('Kunci API') ||
                        msg.text.includes('kunci API')) && (
                        <div className="mt-3 pt-2.5 border-t border-rose-200 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setShowApiKeyModal(true)}
                            className="btn-primary-burgundy inline-flex items-center gap-1.5 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full shadow-[0_2px_8px_rgba(128,0,32,0.22)] transition-all cursor-pointer min-h-[44px]"
                          >
                            <span>🔑</span>
                            <span>Sambungkan Kunci Gemini di Sini</span>
                          </button>
                        </div>
                      )}

                    {/* Meta info inside Bot Bubble */}
                    {!msg.isError && (
                      <div className="mt-3 pt-2 border-t border-[#EBE1D7] flex items-center justify-between gap-2 flex-wrap text-xs">
                        <div className="flex items-center gap-1.5 text-[#7A6E77] font-medium">
                          {msg.isLocalCalculation ? (
                            <span className="text-[#0D7355] font-semibold bg-[#E8F5E9] border border-[#C8E6C9] px-2 py-0.5 rounded-full">
                              Kiraan Pantas
                            </span>
                          ) : (
                            <span className="text-[#800020] font-semibold bg-[#F8EAE8] border border-[#EED7D5] px-2 py-0.5 rounded-full">
                              Jawapan AI
                            </span>
                          )}
                          {msg.timestamp && (
                            <span className="text-[#7A6E77]">
                              &bull; {msg.timestamp}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contextual Follow-up Chips (Cadangan Balas Cepat) BELOW latest bot message */}
              {isLastMessage && showFollowUpChips && (
                <div className="mt-2.5 space-y-2 animate-fadeIn w-full overflow-x-hidden">
                  <span className="text-xs font-bold text-[#171317] tracking-wide block">
                    Cadangan Balas Cepat:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {latestMessage.suggestedFollowUps!.map((chipText, chipIdx) => (
                      <button
                        key={chipIdx}
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                          if (chipText.toLowerCase() === 'terangkan lagi') {
                            handleExplainMore(latestMessage)
                          } else {
                            handleSelectSuggestion(chipText)
                          }
                        }}
                        className="text-xs sm:text-sm font-semibold bg-white hover:bg-[#FAF4EA] active:bg-[#F4EDE5] text-[#171317] hover:text-[#800020] px-4 py-2.5 min-h-[44px] rounded-full border border-[#EBE1D7] hover:border-[#800020] shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <ChatBubbleIcon className="w-3.5 h-3.5 text-[#800020]" />
                        <span>{chipText}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Typing/Thinking indicator */}
        {isLoading && (
          <div className="animate-fadeIn max-w-[95%] sm:max-w-[90%]">
            <div className="bg-white text-[#171317] border border-[#EBE1D7] rounded-[20px] rounded-tl-[4px] sm:rounded-[22px] sm:rounded-tl-[6px] px-4 py-3 text-xs sm:text-sm shadow-[0_2px_12px_rgba(23,19,23,0.03)] flex items-center gap-2.5">
              <span className="flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-[#800020] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#800020] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#800020] animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="text-[#7A6E77] font-medium">
                Mekara sedang sediakan jawapan...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Latest Button */}
      {showScrollBottomBtn && (
        <button
          type="button"
          onClick={() => {
            scrollToBottom('smooth')
            isNearBottomRef.current = true
          }}
          className={`absolute right-4 sm:right-6 z-20 bg-white/95 border border-[#EBE1D7] text-[#800020] shadow-[0_4px_16px_rgba(23,19,23,0.1)] p-2.5 rounded-full hover:bg-[#FAF4EA] hover:border-[#800020] transition-all active:scale-95 flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px] ${
            isKeyboardOpen ? 'bottom-16' : 'bottom-20'
          }`}
          aria-label="Tatal ke mesej terkini"
          title="Mesej Terkini"
        >
          <ChevronDownIcon className="w-4 h-4 text-[#800020]" />
        </button>
      )}

      {/* 2. Message Composer Anchored at Bottom */}
      <div
        className={`shrink-0 bg-[#FAF7F2] border-t border-[#EBE1D7] px-3 pt-2.5 sm:pt-3 relative z-20 transition-[padding] duration-150 ${
          isKeyboardOpen
            ? 'pb-2.5'
            : 'pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]'
        }`}
      >
        {/* Floating Suggestions Panel (Cadangan Soalan) */}
        {showSuggestions && (
          <div
            ref={suggestionsRef}
            role="dialog"
            aria-label="Cadangan Soalan"
            className={`absolute bottom-full left-2 right-2 sm:left-4 sm:right-4 mb-2 bg-[#FAF6F0] rounded-[22px] border border-[#EBE1D7] shadow-[0_8px_30px_rgba(23,19,23,0.12)] p-3.5 overflow-y-auto space-y-2 animate-fadeIn z-30 ${
              isKeyboardOpen ? 'max-h-[180px]' : 'max-h-[280px]'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#EBE1D7] px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#171317]">
                <LightBulbIcon className="w-4 h-4 text-[#800020]" />
                <span>Cadangan Soalan Jualan:</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSuggestions(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-xs text-[#7A6E77] hover:text-[#800020] hover:bg-[#FAF4EA] rounded-full cursor-pointer transition-colors"
                aria-label="Tutup Cadangan"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {adaptiveQuestions.map((sq) => (
                <button
                  key={sq.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(sq.text)}
                  className="apple-hover-card w-full text-left text-xs sm:text-sm text-[#171317] hover:text-[#800020] bg-white hover:bg-[#FAF4EA] p-3 rounded-[14px] border border-[#EBE1D7] hover:border-[#800020] shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.99] min-h-[44px]"
                >
                  <ChatBubbleIcon className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                  <span className="line-clamp-2">{sq.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Composer Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage(inputText)
          }}
          className="flex items-center gap-2"
        >
          {/* Lightbulb Button Immediately Beside Message Input */}
          <button
            ref={lightbulbBtnRef}
            type="button"
            onClick={() => setShowSuggestions((prev) => !prev)}
            className={`min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 active:scale-95 ${
              showSuggestions
                ? 'bg-[#800020] text-white border-[#800020] shadow-[0_2px_8px_rgba(128,0,32,0.25)]'
                : 'bg-white text-[#800020] border-[#EBE1D7] hover:bg-[#FAF4EA] hover:border-[#800020]'
            }`}
            aria-label="Cadangan Soalan"
            title="Cadangan Soalan"
            aria-expanded={showSuggestions}
          >
            <LightBulbIcon className="w-5 h-5" />
          </button>

          {/* Message Input */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Tanya tentang jualan Puan..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => {
                setIsKeyboardOpen(true)
                window.scrollTo(0, 0)
                setTimeout(() => {
                  window.scrollTo(0, 0)
                  scrollToBottom('smooth')
                }, 80)
              }}
              onBlur={() => {
                window.scrollTo(0, 0)
                setTimeout(() => {
                  window.scrollTo(0, 0)
                  if (window.visualViewport) {
                    setIsKeyboardOpen(window.innerHeight - window.visualViewport.height > 120)
                  } else {
                    setIsKeyboardOpen(false)
                  }
                }, 100)
              }}
              disabled={isLoading}
              className="w-full min-h-[44px] sm:min-h-[48px] px-4 py-2.5 text-base sm:text-sm text-[#171317] bg-white rounded-full border border-[#EBE1D7] focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] shadow-2xs transition-all placeholder:text-[#7A6E77]"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="btn-primary-burgundy min-h-[44px] min-w-[44px] sm:min-h-[48px] px-4 sm:px-5 text-white font-bold text-sm sm:text-base rounded-full shadow-[0_2px_8px_rgba(128,0,32,0.22)] hover:shadow-[0_4px_12px_rgba(128,0,32,0.3)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
            aria-label="Hantar soalan"
          >
            <PaperAirplaneIcon className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Hantar</span>
          </button>
        </form>
      </div>

      {/* API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSaved={() => setKeyVersion((v) => v + 1)}
      />
    </div>
  )
}
