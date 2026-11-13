import React, { useState, useRef, useEffect } from 'react'
import { MarkdownText } from './MarkdownText'
import { ApiKeyModal } from './ApiKeyModal'
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  ChatBubbleIcon,
  PencilIcon,
  PaperAirplaneIcon,
  InfoIcon,
} from './ui/Icons'
import {
  getAdaptiveSuggestedQuestions,
  getAssistantResponse,
} from '../services/aiAssistant'
import type { SalesResult, ChatMessage } from '../types'

export interface ChatProps {
  result: SalesResult
  messages: ChatMessage[]
  onUpdateMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  onBack: () => void
}

export function Chat({
  result,
  messages,
  onUpdateMessages,
  onBack,
}: ChatProps) {
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [, setKeyVersion] = useState(0)
  const hasCustomKey = typeof window !== 'undefined' ? Boolean(localStorage.getItem('user_gemini_api_key')) : false
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const adaptiveQuestions = getAdaptiveSuggestedQuestions(result)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

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

    try {
      const response = await getAssistantResponse(trimmed, result, messages)
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
    <div className="space-y-4 max-w-xl mx-auto pb-4">
      {/* 1. Header Card (Title, Subtitle "Nasihat perniagaan ringkas dan mudah", Papan Pemuka Button - No Gemini Teal) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#F1D3E3] p-3 sm:p-3.5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-1 text-[#28152F] hover:text-[#BE1E72] hover:bg-pink-50 rounded-xl transition-colors cursor-pointer active:scale-95"
            aria-label="Kembali ke Papan Pemuka"
            title="Kembali ke Papan Pemuka"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#28152F] font-heading leading-tight">
              Pembantu Niaga AI
            </h1>
            <p className="text-[11px] sm:text-xs text-[#68586B] font-body mt-0.5">
              Nasihat perniagaan ringkas dan mudah
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowApiKeyModal(true)}
            title="Tetapan Kunci API Gemini"
            className="relative w-10 h-10 rounded-full border border-[#F1D3E3] bg-white hover:bg-[#FFF5FA] active:scale-95 text-[#68586B] hover:text-[#BE1E72] flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <span className="text-base" aria-hidden="true">🔑</span>
            {hasCustomKey && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="text-xs sm:text-sm font-bold text-[#BE1E72] hover:text-[#9B1258] bg-[#FCE7F3] hover:bg-pink-100 active:scale-95 px-3.5 sm:px-4 py-2 min-h-[44px] rounded-full border border-pink-200 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            Papan Pemuka
          </button>
        </div>
      </div>

      {/* 2. Suggested Questions Above Chat (Cadangan Soalan Pantas) - Smooth horizontal scroll action without visible scroller UI */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#28152F] px-1">
          <SparklesIcon className="w-4 h-4 text-[#BE1E72]" />
          <span>Cadangan Soalan Pantas:</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar scroll-smooth">
          {adaptiveQuestions.map((sq) => (
            <button
              key={sq.id}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(sq.text)}
              className="whitespace-nowrap shrink-0 text-xs sm:text-sm bg-white hover:bg-pink-50 active:bg-pink-100 text-[#28152F] hover:text-[#BE1E72] font-semibold px-4 py-2.5 rounded-full border border-[#F1D3E3] shadow-2xs transition-all cursor-pointer disabled:opacity-50 min-h-[42px] flex items-center gap-2 active:scale-[0.98]"
            >
              <ChatBubbleIcon className="w-3.5 h-3.5 text-[#BE1E72] shrink-0" />
              <span>{sq.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Dedicated Chat Container (Berry Pop card - No horizontal scrolling UI inside) */}
      <div className="bg-white rounded-3xl border border-[#F1D3E3] shadow-xs flex flex-col h-[520px] sm:h-[560px] overflow-hidden">
        {/* Messages Stream (Independent Vertical Scroll, Zero Horizontal Scroll) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-4 space-y-3.5 relative scroll-smooth">
          {/* Subtle Date Divider */}
          <div className="flex justify-center my-1">
            <span className="text-[11px] font-bold text-[#68586B] bg-[#FFF5FA] border border-[#F1D3E3] px-3 py-1 rounded-full shadow-2xs">
              Hari ini
            </span>
          </div>

          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user'
            const isBot = msg.sender === 'bot'
            const isLastMessage = index === messages.length - 1

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* User Message Bubble */}
                {isUser && (
                  <div className="max-w-[85%] sm:max-w-[78%] bg-[#BE1E72] text-white rounded-2xl sm:rounded-3xl rounded-br-xs px-4 py-2.5 sm:py-3 shadow-2xs break-words">
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>
                    {msg.timestamp && (
                      <div className="text-[10px] text-pink-100 text-right mt-1 font-medium flex items-center justify-end gap-1">
                        <span>{msg.timestamp}</span>
                        <span className="font-bold tracking-tighter">&#10003;&#10003;</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bot Message Bubble */}
                {isBot && (
                  <div className="flex items-start gap-2 max-w-[95%] sm:max-w-[88%] w-full">
                    {/* Bot Avatar Icon */}
                    <div
                      className={`w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                        msg.isError
                          ? 'bg-red-500'
                          : 'bg-gradient-to-tr from-[#BE1E72] to-[#7C3AED]'
                      }`}
                    >
                      <SparklesIcon className="w-4 h-4 text-white" />
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`flex-1 rounded-2xl sm:rounded-3xl rounded-tl-xs p-3.5 sm:p-4 text-sm sm:text-base leading-relaxed shadow-2xs transition-all break-words ${
                        msg.isError
                          ? 'bg-red-50 text-red-900 border border-red-200'
                          : 'bg-white text-[#28152F] border border-[#F1D3E3]'
                      }`}
                    >
                      {/* Render message content safely */}
                      <div className="text-inherit">
                        <MarkdownText content={msg.text} />
                      </div>

                      {/* Action button if API key issue */}
                      {msg.isError && (msg.text.includes('GEMINI_API_KEY') || msg.text.includes('Kunci API') || msg.text.includes('kunci API')) && (
                        <div className="mt-3 pt-2.5 border-t border-red-200 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setShowApiKeyModal(true)}
                            className="inline-flex items-center gap-1.5 bg-[#BE1E72] hover:bg-[#A3165F] active:bg-[#8B0F4E] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer min-h-[38px]"
                          >
                            <span>🔑</span>
                            <span>Masukkan Kunci API di sini</span>
                          </button>
                        </div>
                      )}

                      {/* Meta info & "Terangkan Lagi" inside Bot Bubble (No Teal) */}
                      {!msg.isError && (
                        <div className="mt-3 pt-2.5 border-t border-[#F1D3E3] flex items-center justify-between gap-2 flex-wrap text-[11px]">
                          <div className="flex items-center gap-1.5 text-[#68586B] font-medium">
                            {msg.isLocalCalculation ? (
                              <span className="text-[#7C3AED] font-bold flex items-center gap-1">
                                <span>&#9889;</span>
                                <span>Pengiraan Segera</span>
                              </span>
                            ) : (
                              <span className="text-[#68586B] font-semibold flex items-center gap-1">
                                <span>&#9889;</span>
                                <span>
                                  Gemini ({msg.model || 'gemini-1.5-flash-lite'})
                                </span>
                              </span>
                            )}
                            {msg.timestamp && (
                              <span className="text-[#A191A3]">
                                &bull; {msg.timestamp}
                              </span>
                            )}
                          </div>

                          {/* "Terangkan Lagi" Button */}
                          {!msg.isLocalCalculation && (
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleExplainMore(msg)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#BE1E72] bg-[#FFF5FA] hover:bg-pink-100 active:scale-95 px-3 py-1.5 min-h-[36px] rounded-xl border border-[#F1D3E3] transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                              title="Minta penjelasan lebih mendalam"
                            >
                              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[#BE1E72]" />
                              <span>Terangkan Lagi</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contextual Follow-up Chips (Cadangan Balas Cepat) BELOW latest bot message - Wrapped naturally */}
                {isLastMessage && showFollowUpChips && (
                  <div className="mt-3 ml-10 space-y-2 animate-fadeIn w-full overflow-x-hidden">
                    <span className="text-xs font-bold text-[#28152F] tracking-wide block">
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
                            } else if (chipText.toLowerCase().includes('selalu habis')) {
                              handleSendMessage(
                                'Produk saya selalu habis dijual sebelum masa tutup.'
                              )
                            } else if (chipText.toLowerCase().includes('masih berbaki')) {
                              handleSendMessage(
                                'Stok saya biasanya masih ada berbaki selepas jualan selesai.'
                              )
                            } else {
                              handleSendMessage(chipText)
                            }
                          }}
                          className="text-xs sm:text-sm font-semibold bg-white hover:bg-pink-50 active:bg-pink-100 text-[#28152F] hover:text-[#BE1E72] px-3.5 py-2 min-h-[44px] rounded-full border border-[#F1D3E3] shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <ChatBubbleIcon className="w-3.5 h-3.5 text-[#BE1E72]" />
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
            <div className="flex items-start gap-2 animate-fadeIn">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#BE1E72] to-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white text-[#28152F] border border-[#F1D3E3] rounded-2xl sm:rounded-3xl rounded-tl-xs px-4 py-3 text-xs sm:text-sm shadow-2xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#BE1E72] animate-ping" />
                <span className="text-[#68586B] font-medium">
                  Pembantu AI sedang merangka jawapan ringkas...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 4. Chat Composer Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage(inputText)
        }}
        className="flex items-center gap-2 pt-1"
      >
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#BE1E72]">
            <PencilIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Taip soalan Puan di sini..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="w-full min-h-[48px] pl-10 pr-4 py-2.5 text-sm sm:text-base text-[#28152F] bg-white rounded-full border border-[#F1D3E3] focus:outline-none focus:ring-2 focus:ring-[#BE1E72] focus:border-[#BE1E72] shadow-2xs transition-all placeholder:text-[#A191A3]"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="min-h-[48px] px-5 sm:px-6 bg-[#BE1E72] hover:bg-[#9B1258] active:scale-95 text-white font-bold text-sm sm:text-base rounded-full shadow-md shadow-pink-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
        >
          <PaperAirplaneIcon className="w-4 h-4 text-white" />
          <span>Hantar</span>
        </button>
      </form>

      {/* 5. Compact Privacy Section (Below Composer) */}
      <div className="bg-[#FFF0F7] rounded-2xl border border-[#F1D3E3] p-3 text-center flex items-center justify-center gap-2.5 shadow-2xs">
        <div className="w-5 h-5 rounded-full bg-white border border-[#F1D3E3] flex items-center justify-center shrink-0">
          <InfoIcon className="w-3.5 h-3.5 text-[#BE1E72]" />
        </div>
        <p className="text-[11px] sm:text-xs text-[#68586B] font-body text-left sm:text-center">
          Soalan dihantar ke Google Gemini untuk mendapat jawapan berkaitan perniagaan Puan.
        </p>
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
