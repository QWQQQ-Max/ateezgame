import { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, ChevronDown } from 'lucide-react';
import { PlayerSetup, Message } from '../types';
import { buildSystemPrompt, buildStateTag } from '../data/systemPrompt';

interface ChatScreenProps {
  setup: PlayerSetup;
  onRestart: () => void;
}

export default function ChatScreen({ setup, onRestart }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // ── 硬锁状态：周数 & 本周事件计数 ──────────────────────────────
  const [currentWeek, setCurrentWeek] = useState(1);
  const [eventsThisWeek, setEventsThisWeek] = useState(0);
  // ─────────────────────────────────────────────────────────────

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasStarted = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const fromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollBtn(fromBottom > 200);
    };
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      startGame();
    }
  }, []);

  // ── 解析 AI 回复，更新周数/事件计数 ──────────────────────────
  const updateWeekState = (reply: string) => {
    const isWeekEnd = reply.includes('周结束');
    const hasEvent = reply.includes('【') && reply.includes('】');

    if (isWeekEnd) {
      // AI 自动推进到下一周并生成了第1个事件
      setCurrentWeek(prev => prev + 1);
      setEventsThisWeek(1);
    } else if (hasEvent) {
      setEventsThisWeek(prev => prev + 1);
    }
  };
  // ─────────────────────────────────────────────────────────────

  /**
   * 发送给 API 时，在最后一条 user 消息内容前注入状态标签。
   * 注意：这只影响发给模型的内容，聊天界面显示的是原始文本。
   */
  const callAPI = async (
    msgs: Message[],
    week: number,
    events: number,
  ) => {
    const systemPrompt = buildSystemPrompt(setup);
    const stateTag = buildStateTag(week, events);

    // 把状态标签注入最后一条 user 消息（不修改原 messages state）
    const apiMessages = msgs.map((m, idx) => {
      if (idx === msgs.length - 1 && m.role === 'user') {
        return { role: m.role, content: stateTag + m.content };
      }
      return { role: m.role, content: m.content };
    });

const response = await fetch('https://ai.xiaoye.io/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'claude-opus-4-6',
        messages: [
          { role: 'system', content: systemPrompt },
          ...apiMessages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    const data = await response.json();
    return data.choices[0].message.content as string;
  };

  const startGame = async () => {
    setIsLoading(true);
    try {
      const initMsg: Message = {
        role: 'user',
        content: '开始游戏',
      };
      // 初始：第1周，已发生0个事件
      const reply = await callAPI([initMsg], 1, 0);
      setMessages([{ role: 'assistant', content: reply }]);
      // 开局 AI 必然生成第1个事件，计数+1
      updateWeekState(reply);
    } catch {
      setMessages([{
        role: 'assistant',
        content: '连接失败，请稍后重试。',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // 把当前周数/事件计数传入，由 callAPI 注入状态标签
      const reply = await callAPI(newMessages, currentWeek, eventsThisWeek);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
      // 根据回复内容更新计数
      updateWeekState(reply);
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: '⚠ 请求失败，请重试。',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const isPanel =
        line.startsWith('男主好感度') ||
        line.startsWith('第') ||
        line.startsWith('玩家属性') ||
        line.startsWith('当前') ||
        line.startsWith('人气值') ||
        line.startsWith('心情值') ||
        line.startsWith('金钱') ||
        line.startsWith('事业压力') ||
        line.startsWith('=== 第');   // 周结束标题也用面板样式
      const isEventTitle = line.startsWith('【') && line.endsWith('】');
      const isOption = /^[ABCD]\./.test(line.trim()) || /^[ABCD]、/.test(line.trim());
      const isHeader = line.startsWith('##') || line.startsWith('**');

      if (isEventTitle) {
        return (
          <div key={i} className="text-rose-400 font-medium mt-4 mb-2">{line}</div>
        );
      }
      if (isOption) {
        return (
          <div key={i} className="ml-4 py-0.5 text-zinc-300 hover:text-white cursor-default">{line}</div>
        );
      }
      if (isPanel) {
        return (
          <div key={i} className="text-zinc-400 font-mono text-xs py-0.5">{line}</div>
        );
      }
      if (isHeader) {
        return (
          <div key={i} className="text-white font-medium mt-2">{line.replace(/\*\*/g, '')}</div>
        );
      }
      if (line === '') {
        return <div key={i} className="h-2" />;
      }
      return <div key={i} className="text-zinc-200 leading-relaxed">{line}</div>;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between bg-zinc-900/50 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          <div>
            <div className="text-white text-sm font-light tracking-wide">ATEEZ 恋爱指南</div>
            <div className="text-zinc-500 text-xs">
              {setup.year} 年 · {setup.playerName}
              {/* 调试用：显示当前周数和事件计数，上线前可删除 */}
              <span className="ml-2 text-zinc-700">W{currentWeek} E{eventsThisWeek}/3</span>
            </div>
          </div>
        </div>
        <button
          onClick={onRestart}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          重新开始
        </button>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
      >
        {messages.length === 0 && isLoading && (
          <div className="flex justify-center items-center h-full">
            <div className="space-y-3 text-center">
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-rose-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-zinc-500 text-sm">正在初始化游戏...</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' ? (
              <div className="max-w-[85%] space-y-1">
                <div className="text-zinc-600 text-xs ml-1 mb-2">DM</div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-sm px-5 py-4 text-sm space-y-0.5">
                  {formatContent(msg.content)}
                </div>
              </div>
            ) : (
              <div className="max-w-[70%] space-y-1">
                <div className="text-zinc-600 text-xs mr-1 mb-2 text-right">{setup.playerName}</div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-sm px-4 py-3 text-sm text-zinc-200">
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm px-5 py-4">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shadow-lg"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Input */}
      <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-900/50 backdrop-blur shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded-sm focus-within:border-rose-400/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="输入你的行动或选择选项..."
              rows={1}
              disabled={isLoading}
              className="w-full bg-transparent px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none resize-none leading-relaxed disabled:opacity-50"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-sm bg-rose-500 hover:bg-rose-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center mt-2">
          <span className="text-zinc-700 text-xs">Enter 发送 · Shift+Enter 换行</span>
        </div>
      </div>
    </div>
  );
}
