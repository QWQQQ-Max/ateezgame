import { Heart, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo area */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-rose-400 to-transparent" />
          <span className="text-rose-400 text-xs tracking-[0.4em] uppercase font-light">ATEEZ</span>
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-rose-400 to-transparent" />
        </div>

        {/* Title */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            <h1 className="text-3xl md:text-4xl font-light text-white tracking-widest">
              恋爱指南
            </h1>
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
          </div>
          <p className="text-zinc-500 text-xs tracking-[0.3em] uppercase">Love Guide · K-POP Romance Simulator</p>
        </div>

        {/* Description */}
        <div className="border border-zinc-800 rounded-sm p-8 bg-zinc-900/30 space-y-6 text-left">
          <div className="flex gap-3 items-start">
            <Sparkles className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-zinc-300 text-sm leading-relaxed">
              在本游戏中，你将扮演一名闯入 K-POP 世界的普通人，与 ATEEZ 的某位成员相遇，并在 2018 至 2026 年的时间长河中，共同面对现实、事业、舆论与情感的考验。
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <Sparkles className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-zinc-300 text-sm leading-relaxed">
              没有天选剧本，每个选择都将真实导向甜蜜、遗憾、成长或分离。
            </p>
          </div>

          <div className="border-t border-zinc-800 pt-6 grid grid-cols-3 gap-4 text-center">
            {[
              { label: '8位', sub: '可攻略成员' },
              { label: '多线', sub: '故事走向' },
              { label: '写实', sub: '韩娱背景' },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="text-white text-lg font-light">{item.label}</div>
                <div className="text-zinc-500 text-xs">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 开源公告区 */}
        <div className="border border-zinc-800/60 rounded-sm p-4 bg-zinc-900/40 text-left text-xs text-zinc-400 leading-relaxed space-y-1">
          <p>本关键代码段已开源，由于本人金币告急所以只能换成便宜api代理，可能会更傻一点，有需要请下载文件自行使用：通过百度网盘分享的文件：ATEEZ 版嫂…</p>
          <p>
            链接:<a href="https://pan.baidu.com/s/1mOsTRd3_gJ1PyGUxT0X7Xw?pwd=btl2" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:text-rose-300 transition-colors break-all ml-1">https://pan.baidu.com/s/1mOsTRd3_gJ1PyGUxT0X7Xw?pwd=btl2</a>
          </p>
          <p>复制这段内容打开「百度网盘APP 即可获取」</p>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className="group relative px-12 py-4 bg-rose-500 hover:bg-rose-400 text-white text-sm tracking-[0.2em] uppercase transition-all duration-300 rounded-sm overflow-hidden"
        >
          <span className="relative z-10">开始游戏</span>
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>

        <p className="text-zinc-600 text-xs">
          由 AI 驱动 · 每次游玩体验独一无二
        </p>
      </div>
    </div>
  );
}