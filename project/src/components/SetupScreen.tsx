import { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { MEMBERS } from '../data/members';
import { PlayerSetup, PlayerRole } from '../types';

interface SetupScreenProps {
  onComplete: (setup: PlayerSetup) => void;
  onBack: () => void;
}

const ROLES: { id: PlayerRole; label: string; desc: string }[] = [
  { id: 'exchange_student', label: '留学生', desc: '在首尔读书，与娱乐圈无关' },
  { id: 'atiny', label: 'atiny / 海外粉丝', desc: '曾默默关注ATEEZ很久' },
  { id: 'intern', label: '娱乐公司实习生', desc: '经纪公司、宣传组、内容组或艺人管理部门实习' },
  { id: 'tv_staff', label: '音乐节目工作人员', desc: '打歌节目、年末舞台、颁奖礼或综艺棚工作人员' },
  { id: 'stylist', label: '妆造师 / 发型助理', desc: '参与舞台妆造、杂志拍摄、MV或巡演妆发' },
  { id: 'translator', label: '翻译 / 海外商务助理', desc: '采访翻译、品牌活动或巡演随行' },
  { id: 'parttime', label: '兼职生', desc: '咖啡店 / 便利店 / 花店，在首尔普通生活' },
  { id: 'custom', label: '自定义身份', desc: '由玩家自行描述，DM合理嵌入韩娱背景' },
];

const YEARS = Array.from({ length: 9 }, (_, i) => 2018 + i);

export default function SetupScreen({ onComplete, onBack }: SetupScreenProps) {
  const [step, setStep] = useState<'members' | 'year' | 'role' | 'name'>('members');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedRole, setSelectedRole] = useState<PlayerRole | null>(null);
  const [customRole, setCustomRole] = useState('');
  const [playerName, setPlayerName] = useState('');

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const canProceedMembers = selectedMembers.length > 0;
  const canProceedRole = selectedRole !== null && (selectedRole !== 'custom' || customRole.trim());
  const canProceedName = playerName.trim().length > 0;

  const handleComplete = () => {
    if (!selectedRole || !canProceedName) return;
    onComplete({
      selectedMembers,
      year: selectedYear,
      role: selectedRole,
      customRole: customRole || undefined,
      playerName: playerName.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={step === 'members' ? onBack : () => {
              if (step === 'year') setStep('members');
              else if (step === 'role') setStep('year');
              else if (step === 'name') setStep('role');
            }}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex gap-2">
              {(['members', 'year', 'role', 'name'] as const).map((s, i) => (
                <div
                  key={s}
                  className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    ['members', 'year', 'role', 'name'].indexOf(step) >= i
                      ? 'bg-rose-400'
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Step: Members */}
        {step === 'members' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-xl font-light tracking-wide">选择攻略对象</h2>
              <p className="text-zinc-500 text-sm mt-1">可选择单人或多人同时攻略</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MEMBERS.map((member) => {
                const selected = selectedMembers.includes(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={`relative py-5 px-3 rounded-sm border text-center transition-all duration-200 ${
                      selected
                        ? 'border-rose-400 bg-rose-400/5'
                        : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-600'
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-400 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <div className="text-white text-sm font-medium">{member.nameKr}</div>
                    <div className="text-zinc-500 text-xs mt-1">{member.name}</div>
                  </button>
                );
              })}
            </div>
            <button
              disabled={!canProceedMembers}
              onClick={() => setStep('year')}
              className="w-full py-3 bg-rose-500 hover:bg-rose-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm tracking-widest uppercase transition-colors rounded-sm"
            >
              下一步
            </button>
          </div>
        )}

        {/* Step: Year */}
        {step === 'year' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-xl font-light tracking-wide">选择时间节点</h2>
              <p className="text-zinc-500 text-sm mt-1">克罗默倒转时间，选取你想开始的年份</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`py-4 rounded-sm border text-center transition-all duration-200 ${
                    selectedYear === year
                      ? 'border-rose-400 bg-rose-400/5 text-white'
                      : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-lg font-light">{year}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep('role')}
              className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white text-sm tracking-widest uppercase transition-colors rounded-sm"
            >
              下一步
            </button>
          </div>
        )}

        {/* Step: Role */}
        {step === 'role' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-xl font-light tracking-wide">选择玩家身份</h2>
              <p className="text-zinc-500 text-sm mt-1">你的身份将决定你与成员相遇的方式</p>
            </div>
            <div className="space-y-2">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full p-4 rounded-sm border text-left transition-all duration-200 flex items-center justify-between group ${
                    selectedRole === role.id
                      ? 'border-rose-400 bg-rose-400/5'
                      : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-600'
                  }`}
                >
                  <div>
                    <div className={`text-sm font-medium ${selectedRole === role.id ? 'text-white' : 'text-zinc-300'}`}>
                      {role.label}
                    </div>
                    <div className="text-zinc-500 text-xs mt-0.5">{role.desc}</div>
                  </div>
                  {selectedRole === role.id && (
                    <div className="w-5 h-5 rounded-full bg-rose-400 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {selectedRole === 'custom' && (
              <input
                type="text"
                placeholder="描述你的身份..."
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-rose-400 transition-colors"
              />
            )}
            <button
              disabled={!canProceedRole}
              onClick={() => setStep('name')}
              className="w-full py-3 bg-rose-500 hover:bg-rose-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm tracking-widest uppercase transition-colors rounded-sm"
            >
              下一步
            </button>
          </div>
        )}

        {/* Step: Name */}
        {step === 'name' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-xl font-light tracking-wide">你叫什么名字？</h2>
              <p className="text-zinc-500 text-sm mt-1">这将是故事里属于你的名字</p>
            </div>
            <input
              type="text"
              placeholder="输入你的名字..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canProceedName && handleComplete()}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-4 py-4 text-white text-lg placeholder-zinc-600 focus:outline-none focus:border-rose-400 transition-colors"
              autoFocus
            />

            {/* Summary */}
            <div className="border border-zinc-800 rounded-sm p-4 bg-zinc-900/30 space-y-3 text-sm">
              <div className="text-zinc-500 text-xs tracking-widest uppercase">角色档案</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">攻略对象</span>
                  <span className="text-zinc-300 text-right max-w-[60%]">
                    {selectedMembers.map(id => MEMBERS.find(m => m.id === id)?.nameKr).join('、')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">时间节点</span>
                  <span className="text-zinc-300">{selectedYear} 年</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">玩家身份</span>
                  <span className="text-zinc-300">
                    {selectedRole === 'custom' ? customRole : ROLES.find(r => r.id === selectedRole)?.label}
                  </span>
                </div>
              </div>
            </div>

            <button
              disabled={!canProceedName}
              onClick={handleComplete}
              className="w-full py-3 bg-rose-500 hover:bg-rose-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm tracking-widest uppercase transition-colors rounded-sm"
            >
              进入游戏
            </button>
          </div>
        )}
      </div>
    </div>
  );
}