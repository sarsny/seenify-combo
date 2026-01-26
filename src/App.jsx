import { useMemo, useState, useEffect } from 'react'

const PACKAGES = [
  { id: 'L1', name: '体验版', sub: 'Experience Pack', msrp: 2000, basePrice: 2000, months: 1, platforms: 1, intents: 1, features: ['品牌推荐意图', '基础收录可见', '无情绪修正', '无竞品比对'], freebies: [], tag: '低成本验证' },
  { id: 'L2', name: '基础版', sub: 'Basic Pack', msrp: 24000, basePrice: 19200, months: 3, platforms: 2, intents: 2, features: ['推荐 + 调研意图', '头部平台占位', '情绪修正 (去负面)'], freebies: ['官网GEO技术诊断', 'AI心智洞察工具', '优化周报、月报', '季度动态调优(10%)'], tag: '性价比之王' },
  { id: 'L3', name: '标准版', sub: 'Standard Pack', msrp: 72000, basePrice: 50400, months: 3, platforms: 4, intents: 3, features: ['推荐 + 调研 + 竞品比对', '主流覆盖', '偏好度优化 (赢竞品)'], freebies: ['官网GEO技术诊断', 'AI心智洞察工具', '优化周报、月报', '季度动态调优(10%)'], tag: '进攻主力' },
  { id: 'L4', name: '旗舰版', sub: 'Flagship Pack', msrp: 360000, basePrice: 180000, months: 6, platforms: 6, intents: 5, features: ['全场景统治 (含转化)', 'DeepSeek 深度逻辑优化', '排名前三承诺'], freebies: ['官网GEO技术诊断', '内部培训1次', '每季度动态调优(15%)'], tag: '行业统治' },
]

const ADDONS = [
  { id: 'platform', name: '平台扩展包', desc: '增加 1 个指定平台', unitPrice: 10000, type: 'counter' },
  { id: 'intent', name: '意图扩展包', desc: '增加 1 个新对话场景', unitPrice: 15000, type: 'counter' },
]

const BOOSTERS = [
  { id: 'sentiment', name: '情绪清洗/危机阻断', price: 15000, desc: '专项清洗突发恶评' },
  { id: 'ranking', name: '排名冲刺包', price: 20000, desc: '促销节点短期冲刺 Top3' },
  { id: 'deep_reasoning', name: '深度逻辑包（R1）', price: 20000, desc: '推理模型逻辑链重构（L4含）' },
]
const PLATFORMS = ['豆包', 'DeepSeek', '元宝', 'Kimi', '文小言', '千问']
const INTENTS = ['推荐意图', '品牌调研意图', '竞品比对意图']
const DURATION_MONTHLY_BASE = 5000
const getDefaultIntentCounts = (pkgId) => {
  if (pkgId === 'L1') return { '推荐意图': 1, '品牌调研意图': 0, '竞品比对意图': 0 }
  if (pkgId === 'L2') return { '推荐意图': 1, '品牌调研意图': 1, '竞品比对意图': 0 }
  if (pkgId === 'L3') return { '推荐意图': 1, '品牌调研意图': 1, '竞品比对意图': 1 }
  if (pkgId === 'L4') return { '推荐意图': 2, '品牌调研意图': 1, '竞品比对意图': 2 }
  return { '推荐意图': 0, '品牌调研意图': 0, '竞品比对意图': 0 }
}

const INDUSTRIES = [
  { id: 'very_cold', name: '非常冷门' },
  { id: 'cold', name: '冷门' },
  { id: 'regular', name: '常规' },
  { id: 'hot', name: '激烈' },
  { id: 'very_hot', name: '特别激烈' },
]

const K_TABLE = {
  非常冷门: { 尾部: 1.2, 腰部: 1.0, 头部: 1.0 },
  冷门: { 尾部: 1.4, 腰部: 1.2, 头部: 1.1 },
  常规: { 尾部: 1.8, 腰部: 1.4, 头部: 1.2 },
  激烈: { 尾部: 2.0, 腰部: 1.8, 头部: 1.4 },
  特别激烈: { 尾部: 2.5, 腰部: 2.0, 头部: 1.5 },
}

const formatPrice = (price) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(price)

const hashString = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const mockFetchReport = async (reportId, industryName) => {
  const h = hashString(reportId + industryName)
  const r = (h % 1000) / 1000
  let visibility = industryName === '红海' ? 0.12 + 0.33 * r : industryName === '温带' ? 0.2 + 0.4 * r : 0.6 + 0.3 * r
  visibility = Math.min(0.95, Math.max(0.05, visibility))
  const clarity = 0.6 + 0.35 * (((h >> 8) % 1000) / 1000)
  const emotionPositive = Math.min(0.98, Math.max(0.6, 0.7 + 0.2 * clarity - 0.1 * (((h >> 16) % 1000) / 1000)))
  const preference = Math.min(0.95, Math.max(0.5, 0.6 + 0.3 * (((h >> 24) % 1000) / 1000)))
  await new Promise((res) => setTimeout(res, 650))
  return { visibility, clarity, emotionPositive, preference }
}

function App() {
  const [industry, setIndustry] = useState(INDUSTRIES[2])
  const [visibility, setVisibility] = useState(15)
  const [selectedPkgId, setSelectedPkgId] = useState('L3')
  const [addonConfig, setAddonConfig] = useState({ platform: 0, intent: 0 })
  const [selectedPlatforms, setSelectedPlatforms] = useState(PLATFORMS.slice(0, PACKAGES.find(p=>p.id==='L3').platforms))
  const [intentCounts, setIntentCounts] = useState(getDefaultIntentCounts('L3'))
  const [intentExtensionEnabled, setIntentExtensionEnabled] = useState(false)
  const [boosterConfig, setBoosterConfig] = useState({ sentiment: false, ranking: false, deep_reasoning: false })
  const [durationMonths, setDurationMonths] = useState(0)
  const [reportId, setReportId] = useState('')
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportError, setReportError] = useState('')
  const [clarity, setClarity] = useState(null)
  const [emotionPositive, setEmotionPositive] = useState(null)
  const [preference, setPreference] = useState(75)
  const [industryCollapsed, setIndustryCollapsed] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalContent, setModalContent] = useState('')
  const [rankingCadence, setRankingCadence] = useState('single')
  const [rankingTarget, setRankingTarget] = useState('top3')
  const [rankingCount, setRankingCount] = useState(1)

  const selectedPkg = PACKAGES.find(p => p.id === selectedPkgId)
  const defaultIntentCounts = useMemo(() => getDefaultIntentCounts(selectedPkgId), [selectedPkgId])

  const statusLabel = useMemo(() => {
    const v = Number(visibility) || 0
    if (v < 20) return '尾部'
    if (v <= 60) return '腰部'
    return '头部'
  }, [visibility])

  const kValue = useMemo(() => {
    const name = industry.name
    return (K_TABLE[name] && K_TABLE[name][statusLabel]) || 1.0
  }, [industry, statusLabel])

  const totalIntentCount = useMemo(() => Object.values(intentCounts).reduce((a,b)=>a+b,0), [intentCounts])
  const totalPlatformCount = useMemo(() => selectedPlatforms.length, [selectedPlatforms])
  const intentUnit = useMemo(() => kValue * 2000 * totalPlatformCount, [kValue, totalPlatformCount])
  const durationUnit = useMemo(() => (selectedPkg.basePrice * kValue) / selectedPkg.months, [selectedPkg, kValue])
  const msrpMonthlyK = useMemo(() => (selectedPkg.msrp * kValue) / selectedPkg.months, [selectedPkg, kValue])
  const baseMonthlyK = useMemo(() => (selectedPkg.basePrice * kValue) / selectedPkg.months, [selectedPkg, kValue])
  const recommendIntentCount = useMemo(() => intentCounts['推荐意图'] || 0, [intentCounts])
  const researchIntentCount = useMemo(() => intentCounts['品牌调研意图'] || 0, [intentCounts])
  const compareIntentCount = useMemo(() => intentCounts['竞品比对意图'] || 0, [intentCounts])
  const platformUnit = useMemo(() => (
    kValue * 2000 * (recommendIntentCount + compareIntentCount) + 2000 * researchIntentCount
  ), [kValue, recommendIntentCount, compareIntentCount, researchIntentCount])
  const intentUnitRecommend = useMemo(() => kValue * 2000 , [kValue, totalPlatformCount])
  const intentUnitResearch = useMemo(() => 2000 , [totalPlatformCount])
  const intentUnitCompare = useMemo(() => kValue * 2000 , [kValue, totalPlatformCount])
  const pkgDefaults = useMemo(() => getDefaultIntentCounts(selectedPkgId), [selectedPkgId])
  const pkgRec = useMemo(() => pkgDefaults['推荐意图']||0, [pkgDefaults])
  const pkgRes = useMemo(() => pkgDefaults['品牌调研意图']||0, [pkgDefaults])
  const pkgCmp = useMemo(() => pkgDefaults['竞品比对意图']||0, [pkgDefaults])
  const pkgOrigMonthly = useMemo(() => (
    kValue * 2000 * selectedPkg.platforms * (pkgRec + pkgCmp) + 2000 * selectedPkg.platforms * pkgRes
  ), [kValue, selectedPkg.platforms, pkgRec, pkgCmp, pkgRes])
  const pkgDiscount = useMemo(() => (selectedPkgId==='L2'?0.8:selectedPkgId==='L3'?0.7:selectedPkgId==='L4'?0.5:1.0), [selectedPkgId])
  const pkgMonthlyPrice = useMemo(() => pkgOrigMonthly * pkgDiscount, [pkgOrigMonthly, pkgDiscount])
  const rankingBase = useMemo(() => rankingTarget==='top1' ? 3000 : 1000, [rankingTarget])
  const rankingUnit = useMemo(() => kValue * rankingBase * recommendIntentCount * totalPlatformCount, [kValue, rankingBase, recommendIntentCount, totalPlatformCount])

  const boostersPart = useMemo(() => {
    let sum = 0
    for (const [id, on] of Object.entries(boosterConfig)) {
      if (!on) continue
      if (id === 'ranking') {
        sum += rankingUnit * rankingCount
      } else if (id === 'sentiment') {
        sum += 1000 * totalPlatformCount
      } else {
        const booster = BOOSTERS.find(b => b.id === id)
        sum += booster ? booster.price : 0
      }
    }
    return sum
  }, [boosterConfig, rankingUnit, rankingCount, totalPlatformCount])

  const monthlyPrice = useMemo(() => (
    kValue * 2000 * totalPlatformCount * (recommendIntentCount + compareIntentCount)
    + 2000 * totalPlatformCount * researchIntentCount
    - pkgOrigMonthly + pkgMonthlyPrice
  ), [kValue, totalPlatformCount, recommendIntentCount, compareIntentCount, researchIntentCount, pkgOrigMonthly, pkgMonthlyPrice])

  const extensionMonthly = useMemo(() => (
    Math.max(0, monthlyPrice - pkgMonthlyPrice)
  ), [monthlyPrice, pkgMonthlyPrice])

  const totalPrice = useMemo(() => (
    monthlyPrice * (selectedPkg.months + durationMonths) + boostersPart
  ), [monthlyPrice, selectedPkg.months, durationMonths, boostersPart])

  useEffect(() => {
    if (selectedPkgId === 'L4') setBoosterConfig(prev => ({ ...prev, deep_reasoning: false }))
    const pkg = PACKAGES.find(p=>p.id===selectedPkgId)
    setSelectedPlatforms(PLATFORMS.slice(0, pkg.platforms))
    setIntentCounts(getDefaultIntentCounts(selectedPkgId))
    setIntentExtensionEnabled(false)
    setClarity(null)
    setEmotionPositive(null)
    setDurationMonths(0)
    setPreference(75)
  }, [selectedPkgId])

  useEffect(() => {
    const extraPlatforms = Math.max(0, selectedPlatforms.length - selectedPkg.platforms)
    const totalIntentCount = Object.values(intentCounts).reduce((a,b)=>a+b,0)
    const extraIntents = Math.max(0, totalIntentCount - selectedPkg.intents)
    setAddonConfig({ platform: extraPlatforms, intent: extraIntents })
  }, [selectedPlatforms, intentCounts, selectedPkg])

  const fetchReport = async () => {
    if (!reportId.trim()) return
    setLoadingReport(true)
    setReportError('')
    try {
      const res = await mockFetchReport(reportId.trim(), industry.name)
      setVisibility(Math.round(res.visibility * 100))
      setClarity(res.clarity)
      setEmotionPositive(res.emotionPositive)
      setPreference(Math.round(res.preference * 100))
    } catch (e) {
      setReportError('报告号无效或服务不可用')
    } finally {
      setLoadingReport(false)
    }
  }

  useEffect(() => {
    if (preference < 70) {
      setBoosterConfig(prev => ({ ...prev, sentiment: true }))
    }
  }, [preference])

  const openModal = (title, content) => {
    setModalTitle(title)
    setModalContent(content)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white font-sans flex flex-col lg:flex-row overflow-hidden selection:bg-brand-500/30">
      <div className="lg:w-1/2 relative bg-[#121215] flex flex-col justify-between p-6 lg:p-12 lg:h-screen lg:sticky lg:top-0 border-r border-white/5 z-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-brand-500">⚡</div>
            <h1 className="text-2xl font-bold tracking-tight">犀帆 SEENIFY <span className="text-brand-500">AIO</span></h1>
          </div>
          <p className="text-zinc-400 text-sm">AI 可见性优化配置终端</p>
        </div>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-md">
            <div className="glass-panel rounded-2xl p-8 relative overflow-hidden transition-all duration-500">
              <div className={`absolute -top-20 -right-20 w-64 h-64 ${selectedPkgId==='L3'?'bg-brand-600':selectedPkgId==='L4'?'bg-yellow-600':selectedPkgId==='L2'?'bg-brand-600':'bg-gray-600'} rounded-full mix-blend-screen filter blur-[80px] opacity-20 transition-colors duration-500`}></div>
              <div className={`absolute -bottom-20 -left-20 w-64 h-64 bg-brand-600 rounded-full mix-blend-screen filter blur-[80px] opacity-20`}></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-zinc-400 text-xs font-medium tracking-wider uppercase mb-1">{selectedPkg.sub}</div>
                    <h2 className="text-3xl font-bold text-white mb-2">{selectedPkg.name}</h2>
                    <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border transition-colors duration-300 ${selectedPkgId==='L3'?'bg-brand-500/20 text-brand-300 border-brand-500/30':selectedPkgId==='L4'?'bg-yellow-500/20 text-yellow-300 border-yellow-500/30':'bg-zinc-700/50 text-zinc-300 border-zinc-600'}`}>{PACKAGES.find(p=>p.id===selectedPkgId).tag}</div>
                  </div>
                  <div className="text-right">
                  <div className="text-4xl font-bold text-white tracking-tight">{formatPrice(monthlyPrice)} / 月</div>
                    <div className="text-xs text-zinc-500 mt-1 line-through decoration-brand-500 decoration-2">原价 {formatPrice(kValue * 2000 * totalPlatformCount * totalIntentCount)} / 月</div>
                    <div className="text-xs text-brand-400 mt-1">扩展月费 +{formatPrice(extensionMonthly)} / 月</div>
                    <div className="text-xs text-brand-300 mt-1">加油包费用 +{formatPrice(boostersPart)}</div>
                    <div className="text-sm text-zinc-400 mt-2">总价 <span className="text-white font-medium">{formatPrice(totalPrice)}</span></div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center py-3 border-b border-white/10"><span className="text-zinc-400">🧩 覆盖平台</span><span className="text-white font-semibold">{selectedPkgId==='L4'?'全平台':`${selectedPkg.platforms} 个`}{addonConfig.platform>0 && <span className="text-brand-400 ml-1">+{addonConfig.platform}</span>}</span></div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10"><span className="text-zinc-400">🎯 覆盖意图</span><span className="text-white font-semibold">{selectedPkg.intents} 个{addonConfig.intent>0 && <span className="text-brand-400 ml-1">+{addonConfig.intent}</span>}</span></div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10"><span className="text-zinc-400">📅 服务周期</span><span className="text-white font-semibold">{selectedPkg.months * 30} 天{durationMonths>0 && <span className="text-brand-400 ml-1">+ {durationMonths * 30} 天</span>}</span></div>
                </div>

                <div className="space-y-2">
                  {selectedPkg.features.map((feat, i) => {
                    const negative = feat.startsWith('无')
                    return (
                      <div key={i} className={`flex items-center gap-2 text-sm ${negative ? 'text-zinc-500' : 'text-zinc-300'}`}>{negative ? '✖' : '✅'} {feat}</div>
                    )
                  })}
                  {selectedPkg.freebies?.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-brand-300 mb-1">📜 套餐权益</div>
                      {selectedPkg.freebies.map((gift, i)=> (
                        <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">🎁 {gift}</div>
                      ))}
                    </div>
                  )}
                  {boosterConfig.deep_reasoning && selectedPkgId !== 'L4' && (
                    <div className="flex items-center gap-2 text-sm text-brand-300 animate-fade-in">✅ 深度逻辑优化（R1）</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block text-xs text-zinc-500">* 报价以系统生成的合同为准。K 值由行业与现状共同确定。</div>
      </div>

      <div className="lg:w-1/2 h-full lg:h-screen overflow-y-auto bg-black p-6 lg:p-12 pb-32">
        <div className="mb-12 animate-fade-in" style={{animationDelay: '0.1s'}}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">🧭 行业与现状</h3>
            <div className="flex items-center gap-2">
              <button onClick={()=>openModal('行业与现状', `K 值由行业（${industry.name}）与归类（${statusLabel}）共同决定。当前可见度 ${visibility}%${clarity!==null?`，清晰度 ${(clarity*100).toFixed(0)}%`:''}${emotionPositive!==null?`，积极情绪 ${(emotionPositive*100).toFixed(0)}%`:''}。`)} className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm">🔍 查看详情</button>
              <button onClick={()=>setIndustryCollapsed(v=>!v)} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm">{industryCollapsed?'⤵️ 展开':'⤴️ 折叠'}</button>
            </div>
          </div>
          {!industryCollapsed && (
          <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {INDUSTRIES.map(d => (
              <button key={d.id} onClick={() => setIndustry(d)} className={`p-4 rounded-xl border text-left transition-all duration-200 ${industry.id===d.id?'bg-zinc-800 border-brand-500 text-white shadow-lg shadow-brand-900/10':'bg-[#121215] border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}>
                <div className="font-semibold mb-1">{d.name}</div>
                <div className="text-[10px] leading-tight opacity-50">{d.name}</div>
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-xs text-zinc-400">🧪 诊断报告号</label>
              <input type="text" value={reportId} onChange={(e)=>setReportId(e.target.value)} placeholder="如 DS-202501-0001" className="w-44 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-white" />
              <button onClick={fetchReport} disabled={loadingReport || !reportId.trim()} className="px-3 py-1.5 text-sm rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50">⤓ 拉取报告</button>
              {loadingReport && <span className="text-xs text-zinc-500">拉取中...</span>}
              {reportError && <span className="text-xs text-red-400">{reportError}</span>}
            </div>
              <div className="flex items-center gap-4 flex-wrap">
                <label className="text-xs text-zinc-400">👁️ 诊断报告可见度 (%)</label>
                <input type="number" min="0" max="100" value={visibility} onChange={(e)=>setVisibility(e.target.value)} className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-white" />
                <div className="text-xs text-zinc-500">归类：{statusLabel}</div>
                <label className="text-xs text-zinc-400">💗 偏好度 (%)</label>
                <input type="number" min="0" max="100" value={preference} onChange={(e)=>setPreference(Number(e.target.value))} className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-white" />
                {clarity!==null && (<div className="text-xs text-zinc-400">清晰度 {(clarity*100).toFixed(0)}%</div>)}
                {emotionPositive!==null && (<div className={`text-xs ${emotionPositive>=0.85?'text-green-400':'text-yellow-400'}`}>积极情绪 {(emotionPositive*100).toFixed(0)}%</div>)}
              {preference<70 && (
                <span className="text-xs text-red-400">已强制开启情绪清洗</span>
              )}
              </div>
          </div>
          </>
          )}
        </div>

        <div className="mb-12 animate-fade-in" style={{animationDelay: '0.2s'}}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">📦 套餐选择</h3>
            <button onClick={()=>openModal('套餐说明', `包含平台 ${selectedPkg.platforms}、意图 ${selectedPkg.intents}、服务期 ${selectedPkg.months*30} 天。当前月均 ${formatPrice((selectedPkg.basePrice*kValue)/selectedPkg.months)}，原价月均 ${formatPrice((selectedPkg.msrp*kValue)/selectedPkg.months)}。`)} className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm">查看详情</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PACKAGES.map(pkg => {
              const isActive = selectedPkgId === pkg.id
              const defaults = getDefaultIntentCounts(pkg.id)
              const rec = defaults['推荐意图']||0
              const res = defaults['品牌调研意图']||0
              const cmp = defaults['竞品比对意图']||0
              const origMonthly = kValue * 2000 * pkg.platforms * (rec + cmp) + 2000 * pkg.platforms * res
              const origPrice = origMonthly * pkg.months
              const discount = pkg.id==='L2' ? 0.8 : pkg.id==='L3' ? 0.7 : pkg.id==='L4' ? 0.5 : 1.0
              const effectivePrice = origPrice * discount
              return (
                <div key={pkg.id} onClick={() => setSelectedPkgId(pkg.id)} className={`relative cursor-pointer p-5 rounded-xl border transition-all duration-300 overflow-hidden group ${isActive?'bg-[#121215] border-brand-500 ring-2 ring-brand-500 shadow-lg shadow-brand-900/10':'bg-[#121215] border-zinc-800 hover:border-zinc-600'}`}>
                  {pkg.id==='L3' && (<div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] px-2 py-1 rounded-bl font-bold z-10">RECOMMENDED</div>)}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${isActive?'border-brand-500':'border-zinc-600 group-hover:border-zinc-500'}`}>{isActive && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}</div>
                      <span className={`font-bold transition-colors duration-300 ${isActive?'text-white':'text-zinc-400 group-hover:text-zinc-200'}`}>{pkg.name}</span>
                      {pkg.tag && isActive && (<span className="text-[10px] bg白/10 px-1.5 py-0.5 rounded text-zinc-300">{pkg.tag}</span>)}
                    </div>
                    <div className="text-right">
                    <div className="text-right">
                      <div className="font-mono text-sm text-white">{formatPrice(effectivePrice / pkg.months)} / 月</div>
                      <div className="text-[10px] text-zinc-500 line-through decoration-brand-500">原价 {formatPrice(origMonthly)} / 月</div>
                      <div className="text-[11px] text-zinc-400">总价 {formatPrice(effectivePrice)}</div>
                    </div>
                    </div>
                  </div>
                  <div className={`pl-8 text-xs text-zinc-500 transition-all duration-300 ${isActive?'max-h-28 opacity-100 mt-2':'max-h-0 opacity-0 overflow-hidden'}`}>
                    <p className="mb-2">包含 {pkg.platforms} 平台 · {pkg.intents} 意图 · {pkg.months*30} 天</p>
                    <p>{pkg.features.join(' · ')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-12 animate-fade-in" style={{animationDelay: '0.25s'}}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">🧩 选择平台</h3>
            <button onClick={()=>openModal('平台扩展说明', `套餐默认包含 ${selectedPkg.platforms} 个平台，超过则按 ${formatPrice(10000*kValue)} / 平台计费。当前超出 ${Math.max(0, selectedPlatforms.length - selectedPkg.platforms)}。`)} className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm">查看详情</button>
          </div>
          <div className="space-y-6">
            <div>
              <div className="text-xs text-zinc-400 mb-2">平台（最多选择 6） · 套餐含 {selectedPkg.platforms}，超出按扩展包计费</div>
              <div className="grid grid-cols-3 gap-3">
                {PLATFORMS.map(p => {
                  const active = selectedPlatforms.includes(p)
                  return (
                    <button key={p} onClick={()=> {
                      if (active) {
                        if (selectedPlatforms.length <= selectedPkg.platforms) return
                        setSelectedPlatforms(prev => prev.filter(x=>x!==p))
                      } else {
                        setSelectedPlatforms(prev => [...prev, p])
                      }
                    }} className={`px-3 py-2 text-sm rounded-xl border transition-colors ${active? 'bg-brand-500/10 border-brand-500 text-white' : 'bg-[#121215] border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}`}>{p}</button>
                  )
                })}
              </div>
              <div className="mt-3 p-3 rounded-xl border border-zinc-800 bg-[#121215] flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-400">🧩 平台扩展包</div>
                  <div className="text-[11px] text-brand-400">+{formatPrice(platformUnit)} / 平台 / 月</div>
                </div>
                <div className="text-sm text-zinc-200">计费数量：{Math.max(0, selectedPlatforms.length - selectedPkg.platforms)}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-12 animate-fade-in" style={{animationDelay: '0.3s'}}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">🎯 选择意图</h3>
            <button onClick={()=>openModal('意图扩展说明', `套餐默认意图总数 ${selectedPkg.intents}，每类不可少于默认分配。超出按 ${formatPrice(15000*kValue)} / 意图计费。当前超出 ${Math.max(0, Object.values(intentCounts).reduce((a,b)=>a+b,0) - selectedPkg.intents)}。`)} className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm">查看详情</button>
          </div>
          <div className="space-y-3">
            <div className="text-xs text-zinc-400 mb-2">意图数量 · 套餐含 {selectedPkg.intents}，不可少于默认分配，超出按扩展包计费</div>
            <div className="grid grid-cols-1 gap-3">
              {INTENTS.map(i => {
                const minCount = defaultIntentCounts[i] || 0
                const canDecrease = (intentCounts[i] || 0) > minCount
                const unit = i==='推荐意图' ? intentUnitRecommend : i==='品牌调研意图' ? intentUnitResearch : intentUnitCompare
                const over = Math.max(0, (intentCounts[i]||0) - minCount)
                return (
                  <div key={i} className="p-3 rounded-xl border border-zinc-800 bg-[#121215] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-zinc-200">{i}</div>
                      <span className="text-[11px] text-brand-400">+{formatPrice(unit)} / 平台 / 月</span>
                      <span className="text-[11px] text-zinc-500">拓展包数量：{over}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                      <button onClick={()=> canDecrease && setIntentCounts(prev=>({ ...prev, [i]: Math.max(minCount, (prev[i]||0) - 1) }))} disabled={!canDecrease} className={`w-8 h-8 flex items-center justify-center rounded ${canDecrease? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 bg-zinc-900 cursor-not-allowed'}`}>-</button>
                      <span className="w-6 text-center text-sm font-mono text-zinc-200">{intentCounts[i] || 0}</span>
                      <button onClick={()=> setIntentCounts(prev=>({ ...prev, [i]: (prev[i]||0) + 1 }))} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 rounded hover:text-white">+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          
          </div>
        </div>

        <div className="mb-12 animate-fade-in" style={{animationDelay: '0.35s'}}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">📅 服务周期</h3>
            <button onClick={()=>openModal('周期扩展说明', `默认服务期 ${selectedPkg.months} 月（${selectedPkg.months*30} 天），可按月扩展，计费 ${formatPrice(DURATION_MONTHLY_BASE*kValue)} / 月。当前扩展 ${durationMonths} 月，总期 ${selectedPkg.months+durationMonths} 月（${(selectedPkg.months+durationMonths)*30} 天）。`)} className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm">查看详情</button>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#121215] flex items-center justify-between">
            <div>
              <div className="font-medium text-sm text-zinc-200">📅 服务周期选择</div>
              <div className="text-xs text-zinc-500">默认 {selectedPkg.months} 月（{selectedPkg.months*30} 天），可按月增加</div>
              <div className="text-xs text-brand-400 mt-1">+{formatPrice(monthlyPrice)} / 月</div>
            </div>
            <div className="flex items-center gap-3 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
              <button onClick={()=> setDurationMonths(m=> Math.max(0, m-1))} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 rounded hover:text-white">-</button>
              <span className="w-20 text-center text-sm font-mono text-zinc-200">{selectedPkg.months + durationMonths} 月</span>
              <button onClick={()=> setDurationMonths(m=> m+1)} className="w-8 h-8 flex items中心 justify-center text-zinc-400 hover:bg-zinc-800 rounded hover:text白">+</button>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#121215] flex items-center justify-between mt-3">
              <div>
                <div className="text-xs text-zinc-400">📅 周期扩展包</div>
                <div className="text-[11px] text-brand-400">+{formatPrice(monthlyPrice)} / 月</div>
              </div>
            <div className="text-sm text-zinc-200">计费数量：{durationMonths}</div>
          </div>
          <div className="text-xs text-zinc-400 mt-2">当前总周期：{selectedPkg.months + durationMonths} 月 · {(selectedPkg.months + durationMonths) * 30} 天</div>
        </div>

        <div className="mb-12 animate-fade-in" style={{animationDelay: '0.45s'}}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">⚙️ 加油包</h3>
            <button onClick={()=>openModal('加油包说明', `可选包：情绪清洗 ${formatPrice(15000)}、排名冲刺 ${formatPrice(20000)}、深度逻辑 ${formatPrice(20000)}。按需单次计费。`)} className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm">了解更多</button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {BOOSTERS.map(b => {
              if (b.id === 'ranking') {
                const canUse = Number(visibility) > 60
                return (
                  <div key={b.id} className="p-4 rounded-xl border border-zinc-800 bg-[#121215] hover:border-zinc-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm text-zinc-200">{b.name}</div>
                        <div className="text-xs text-zinc-500">目标与频率可选（可见度＞60% 方可启用）</div>
                      </div>
                      <input type="checkbox" checked={boosterConfig[b.id]||false} onChange={(e)=>setBoosterConfig(prev=>({...prev,[b.id]: e.target.checked}))} className="w-6 h-6 scale-125 accent-brand-500 cursor-pointer focus:ring-2 focus:ring-brand-500 rounded" disabled={!canUse} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">目标</span>
                        <div className="flex gap-2">
                          <button onClick={()=>setRankingTarget('top3')} className={`px-2 py-1 text-xs rounded border ${rankingTarget==='top3'?'border-brand-500 text-white bg-brand-500/10':'border-zinc-700 text-zinc-400'}`}>前三</button>
                          <button onClick={()=>setRankingTarget('top1')} className={`px-2 py-1 text-xs rounded border ${rankingTarget==='top1'?'border-brand-500 text白 bg-brand-500/10':'border-zinc-700 text-zinc-400'}`}>第一</button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">频率</span>
                        <div className="flex gap-2">
                          <button onClick={()=>{setRankingCadence('single'); setRankingCount(1)}} className={`px-2 py-1 text-xs rounded border ${rankingCadence==='single'?'border-brand-500 text-white bg-brand-500/10':'border-zinc-700 text-zinc-400'}`}>单次</button>
                          <button onClick={()=>{setRankingCadence('monthly'); setRankingCount(selectedPkg.months + durationMonths)}} className={`px-2 py-1 text-xs rounded border ${rankingCadence==='monthly'?'border-brand-500 text-white bg-brand-500/10':'border-zinc-700 text-zinc-400'}`}>每月</button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">{rankingCadence==='monthly'?'月数':'次数'}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={()=>setRankingCount(c=>Math.max(1, c-1))} className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">-</button>
                          <span className="w-8 text-center text-sm font-mono text-zinc-200">{rankingCount}</span>
                          <button onClick={()=>setRankingCount(c=>c+1)} className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">+</button>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-brand-400 mt-2">当前计费：+{formatPrice(rankingUnit * rankingCount)}</div>
                  </div>
                )
              }
              return (
                <label key={b.id} className="p-4 rounded-xl border border-zinc-800 bg-[#121215] flex items-center justify-between hover:border-zinc-700 transition-colors">
                  <div>
                    <div className="font-medium text-sm text-zinc-200">{b.name}</div>
                    <div className="text-xs text-zinc-500">{b.desc}</div>
                    <div className="text-xs text-brand-400 mt-1">单次 +{formatPrice(b.id==='sentiment' ? (1000 * totalPlatformCount) : b.price)}</div>
                  </div>
                  <input type="checkbox" checked={b.id==='sentiment' && preference<70 ? true : (boosterConfig[b.id]||false)} onChange={(e)=>setBoosterConfig(prev=>({...prev,[b.id]: e.target.checked}))} className="w-6 h-6 scale-125 accent-brand-500 cursor-pointer focus:ring-2 focus:ring-brand-500 rounded" disabled={b.id==='sentiment' && preference<70} />
                </label>
              )
            })}
          </div>
        </div>

        <div className="mb-12 animate-fade-in" style={{animationDelay: '0.5s'}}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">📏 交付标准</h3>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#121215]">
              <div className="text-sm font-semibold text-zinc-200 mb-2">达标日定义</div>
              <div className="text-xs text-zinc-400">1）推荐意图：可见度 ＞ 80% 或 可见度行业第一</div>
              <div className="text-xs text-zinc-400">2）品牌调研与竞品比对：积极情绪 ＞ 85%</div>
              <div className="text-xs text-zinc-400">3）排名冲刺：前三比例 ≥ 80%</div>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#121215]">
              <div className="text-sm font-semibold text-zinc-200 mb-2">交付标准</div>
              <div className="text-xs text-zinc-400">1）首月突破期：交付至少 1 个达标日</div>
              <div className="text-xs text-zinc-400">2）巩固期（后续每月）：交付 25 个达标日</div>
            </div>
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center">
            <div className="w-[92%] max-w-md bg-[#121215] border border-zinc-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-3">
                <div className="text-lg font-bold text-white">{modalTitle}</div>
                <button onClick={()=>setModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
              </div>
              <div className="text-sm text-zinc-300">{modalContent}</div>
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 lg:static lg:bg-transparent bg-black/90 backdrop-blur-xl border-t lg:border-none border-zinc-800 p-6 lg:p-0 z-50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-xs text-zinc-400">月均投入</div>
              <div className="text-2xl font-bold text-white">{formatPrice(monthlyPrice)} / 月</div>
              <div className="text-[10px] text-zinc-500 line-through decoration-brand-500">原价 {formatPrice((selectedPkg.msrp * kValue) / selectedPkg.months)} / 月</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400">总价</div>
              <div className="text-sm font-medium text白">{formatPrice(totalPrice)}</div>
              {durationMonths>0 && (<div className="text-[10px] text-zinc-500">扩展周期费用 {formatPrice(durationMonths * durationUnit)}</div>)}
            </div>
          </div>
          <button className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2 group active:scale-95">
            <span>生成方案与合同</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
          <p className="text-center text-[10px] text-zinc-600 mt-4">点击即表示您同意《犀帆AIO服务条款》。K 值最终解释权归犀帆所有。</p>
        </div>
      </div>
    </div>
  )
}

export default App
