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

  // ── 核心状态锁 ──────────────────────────────────────────────
  const [currentWeek, setCurrentWeek] = useState(1);
  const [eventsThisWeek, setEventsThisWeek] = useState(0);
  const [isEnded, setIsEnded] = useState(false);

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

  // ── API 调用与强制模板注入 ─────────────────────────────────────────
  const callAPI = async (msgs: Message[], week: number, events: number) => {
    const systemPrompt = buildSystemPrompt(setup);
    const stateTag = buildStateTag(week, events);

    // 模板 1：常规事件填空
    const EVENT_TEMPLATE = `
[强制执行指令]：请严格、一字不差地按照以下【填空模板】输出，禁止加入任何多余的解释或内心OS：

男主好感度：__ // 事业压力：__
当前场景：______
当前男主：______
当前关系阶段：______
玩家属性
心情值：__
金钱：__万韩元
外界属性
警戒度：__

【事件标题】
[这里写剧情正文，第二人称视角叙事，到需要玩家选择时立即停止，严禁代玩家说话或行动]

A. [选项一]
B. [选项二]
C. [选项三]
D. 自由行动`;

    // 模板 2：周结算与新周连放
    const WEEKLY_SETTLEMENT_TEMPLATE = `
[强制执行指令]：检测到本周事件已达上限。请严格、一字不差地按照以下【填空模板】输出周结算，并直接开启下一周，禁止废话：

=== 第 ${week} 周结束 ===
本周结算：
- 男主好感度：__ → __（简短理由）
- 男主事业压力：__ → __（简短理由）
- 玩家心情值：__ → __（简短理由）
- 玩家金钱：__万韩元 → __万韩元（系统已自动扣除第${week}周基础生活费__万韩元及额外开销）
- 外界警戒度：__ → __（简短描述）
---
男主好感度：__ // 事业压力：__
当前场景：______
当前男主：______
当前关系阶段：______
玩家属性
心情值：__
金钱：__万韩元
外界属性
警戒度：__

【事件标题】
[这里写第 ${week + 1} 周的第1个事件剧情正文，第二人称视角叙事，到需要选择时立即停止，严禁代玩]

A. [选项一]
B. [选项二]
C. [选项三]
D. 自由行动`;

    const apiMessages = msgs.map((m, idx) => {
      if (idx === msgs.length - 1 && m.role === 'user') {
        let finalContent = stateTag + m.content;

        if (isEnded || week >= 15) {
          finalContent += `\n\n[结局模式]：故事已进入大结局。请根据各属性直接输出最终结局（HE/OE/SE/BE）及后日谈。无须再按固定模板生成面板和选项，自由发挥即可。`;
        } else if (events >= 3) {
          finalContent += `\n\n${WEEKLY_SETTLEMENT_TEMPLATE}`;
        } else {
          finalContent += `\n\n${EVENT_TEMPLATE}`;
        }
        return { role: m.role, content: finalContent };
      }
      return { role: m.role, content: m.content };
    });

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
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
      const initMsg: Message = { role: 'user', content: '开始游戏' };
      const reply = await callAPI([initMsg], 1, 0);
      setMessages([{ role: 'assistant', content: reply }]);
      setEventsThisWeek(1);
    } catch {
      setMessages([{ role: 'assistant', content: '连接失败，请检查网络或 API 密钥配置。' }]);
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
      const currentW = currentWeek;
      const currentE = eventsThisWeek;

      const reply = await callAPI(newMessages, currentW, currentE);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);

      const hasEnding = reply.includes('结局') ||
                       reply.includes('HE') ||
                       reply.includes('OE') ||
                       reply.includes('BE') ||
                       reply.includes('SE') ||
                       reply.includes('大结局');

      if (hasEnding || currentW >= 15) {
        setIsEnded(true);
        setCurrentWeek(15);
      } else if (!isEnded) {
        const isWeekEnd = reply.includes('周结束') || reply.includes('本周结算');
        const hasEvent = reply.includes('【') && reply.includes('】');

        if (currentE >= 3 || isWeekEnd) {
          setCurrentWeek(prev => prev + 1);
          setEventsThisWeek(1);
        } else if (hasEvent) {
          setEventsThisWeek(prev => prev + 1);
        }
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '⚠ 请求失败，请重试。' }]);
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

  // ── 界面排版渲染增强 ─────────────────────────────────────────────
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const trimmed = line.trim();

      // 1. 周结目标题 (=== 第 X 周结束 ===)
      if (trimmed.startsWith('=== 第') && trimmed.endsWith('===')) {
        return <div key={i} className="text-rose-400 font-bold mt-6 mb-3 text-center tracking-widest">{trimmed}</div>;
      }

      // 2. 分割线 (---)
      if (trimmed === '---') {
        return <hr key={i} className="border-zinc-800 my-5" />;
      }

      // 3. 结算列表项 (- 男主好感度: ...)
      if (trimmed.startsWith('- 男主') || trimmed.startsWith('- 玩家') || trimmed.startsWith('- 外界') || trimmed.startsWith('本周结算')) {
        return <div key={i} className="text-zinc-400 text-sm ml-2 my-1.5 leading-relaxed">{trimmed}</div>;
      }

      // 4. 标准面板区
      const isPanel = trimmed.startsWith('男主好感度') ||
                     trimmed.startsWith('当前') ||
                     trimmed.startsWith('玩家属性') ||
                     trimmed.startsWith('外界属性') ||
                     trimmed.startsWith('心情值') ||
                     trimmed.startsWith('金钱') ||
                     trimmed.startsWith('警戒度');

      const isEventTitle = trimmed.startsWith('【') && trimmed.endsWith('】') && !trimmed.includes('属性');
      const isOption = /^[ABCD][.、]/.test(trimmed);
      const isHeader = trimmed.startsWith('##') || trimmed.startsWith('**');

      if (isEventTitle) {
        return <div key={i} className="text-rose-400 font-medium mt-5 mb-3">{trimmed}</div>;
      }
      if (isOption) {
        return <div key={i} className="ml-4 py-1 text-zinc-300 hover:text-white cursor-default transition-colors">{trimmed}</div>;
      }
      if (isPanel) {
        return <div key={i} className="text-zinc-500 font-mono text-xs py-0.5">{trimmed}</div>;
      }
      if (isHeader) {
        return <div key={i} className="text-white font-medium mt-3 mb-1">{trimmed.replace(/\*\*/g, '')}</div>;
      }
      if (trimmed === '') {
        return <div key={i} className="h-3" />;
      }
      return <div key={i} className="text-zinc-200 leading-relaxed tracking-wide">{trimmed}</div>;
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

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth"
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
              <div className="max-w-[85%] md:max-w-[75%] space-y-1">
                <div className="text-zinc-600 text-xs ml-1 mb-2">DM</div>
                <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg px-5 py-5 text-sm space-y-0.5 shadow-sm">
                  {formatContent(msg.content)}
                </div>
              </div>
            ) : (
              <div className="max-w-[75%] space-y-1">
                <div className="text-zinc-600 text-xs mr-1 mb-2 text-right">{setup.playerName}</div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 text-sm text-zinc-200">
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800/80 rounded-lg px-5 py-4">
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

      {/* Scroll Button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shadow-lg"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Input Area */}
      <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-900/50 backdrop-blur shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg focus-within:border-rose-400/50 transition-colors">
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
            className="w-10 h-10 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center transition-colors shrink-0"
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