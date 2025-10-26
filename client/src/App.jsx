import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are a helpful assistant.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    // auto-scroll to bottom when messages change
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, typing])

  const send = async () => {
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input, time: now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setTyping(true)

    try {
      // Use streaming endpoint so we can show incremental text
      const resp = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      })

      if (!resp.body) throw new Error('No stream available')

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let partial = ''

      // insert an assistant message placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '', time: now() }])

      let done = false
      while (!done) {
        const { value, done: streamDone } = await reader.read()
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          partial += chunk
          // update last assistant message with partial text
          setMessages(prev => {
            const copy = [...prev]
            // find last assistant index
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === 'assistant') { copy[i] = { ...copy[i], content: partial } ; break }
            }
            return copy
          })
        }
        done = streamDone
      }
    } catch (err) {
      console.error(err)
      const msg = err?.message || 'Error: failed to get response'
      setMessages(prev => [...prev, { role: 'assistant', content: msg, time: now() }])
    } finally {
      setLoading(false)
      setTyping(false)
    }
  }

  const extractReply = (data) => {
    if (!data) return 'No response'
    if (data.reply) return typeof data.reply === 'string' ? data.reply : JSON.stringify(data.reply)
    if (data.raw && data.raw.text) return data.raw.text
    if (data.choices && data.choices[0]) {
      if (data.choices[0].message) return data.choices[0].message.content
      if (data.choices[0].text) return data.choices[0].text
    }
    if (data.output && Array.isArray(data.output) && data.output[0]) {
      const o0 = data.output[0]
      if (typeof o0 === 'string') return o0
      if (o0.content) return o0.content
      if (o0.candidates && o0.candidates[0] && o0.candidates[0].content) return o0.candidates[0].content
    }
    return JSON.stringify(data)
  }

  const renderMessage = (m, i) => {
    if (m.role === 'system') return null
    const isUser = m.role === 'user'
    return (
      <div key={i} className={`row ${isUser ? 'user' : 'assistant'}`}>
        <div className={`avatar ${isUser ? 'user' : 'assistant'}`}>{isUser ? 'U' : 'A'}</div>
        <div>
          <div className={`bubble ${m.role}`}>{m.content}</div>
          <div className="meta">{isUser ? 'You' : 'Agent'} • {m.time || ''}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div className="title">Chatbot — Gemini</div>
        <div className="subtitle">Securely proxying requests through your server</div>
      </div>

      <div className="chat" ref={listRef}>
        <div className="messages">
          {messages.map((m, i) => renderMessage(m, i))}
          {typing && (
            <div className="row assistant">
              <div className="avatar assistant">A</div>
              <div>
                <div className="bubble assistant"><span className="typing"><span className="dots"><span className="dot"/><span className="dot"/><span className="dot"/></span> Thinking...</span></div>
                <div className="meta">Agent • ...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="composer">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask something — the agent will answer securely" disabled={loading} />
        <button onClick={send} disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
      </div>
    </div>
  )
}
