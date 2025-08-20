import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { accountValueData, netReturnData, cashflowData, portfolioAllocation, performanceTrend, riskAnalysisData, COLORS } from '../../lib/demoData.js'

export function AnimatedChartCard({ title, subtitle, darkMode, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={darkMode ? 'bg-gray-800 shadow rounded-lg p-6' : 'bg-white shadow rounded-lg p-6'}
    >
      <h2 className='text-lg font-semibold mb-1'>{title}</h2>
      {subtitle ? <p className='text-gray-500 text-sm mb-3'>{subtitle}</p> : null}
      {children}
    </motion.div>
  )
}

export function StatCard({ label, value, darkMode }) {
  return (
    <div className={darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-lg shadow' : 'bg-gradient-to-r from-green-50 to-white p-4 rounded-lg shadow'}>
      <p className={darkMode ? 'text-sm text-gray-400' : 'text-sm text-gray-500'}>{label}</p>
      <p className={darkMode ? 'text-xl font-bold text-green-400' : 'text-xl font-bold text-green-700'}>{value}</p>
    </div>
  )
}

export default function OverviewSection({ darkMode, timeframe, setTimeframe, tooltipStyle }) {
  return (
    <div>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10'>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <StatCard label='Contribution' value='$120,000' darkMode={darkMode} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <StatCard label='Distributions' value='$3,370.80' darkMode={darkMode} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.0 }}>
          <StatCard label='Cash Yield' value='9%' darkMode={darkMode} />
        </motion.div>
      </div>

      <div className='flex justify-end mb-6'>
        <div className={
          darkMode
            ? 'bg-gray-800 rounded-lg shadow px-2 py-1 flex space-x-2 text-sm'
            : 'bg-white rounded-lg shadow px-2 py-1 flex space-x-2 text-sm'
        }>
          {'Quarterly Yearly'.split(' ').map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-md ${
                timeframe === t
                  ? 'bg-green-600 text-white'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <AnimatedChartCard title='Account Value' subtitle='$123,370.80' darkMode={darkMode}>
          <ResponsiveContainer width='100%' height={220}>
            <LineChart data={accountValueData}>
              <CartesianGrid strokeDasharray='3 3' stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey='quarter' stroke={darkMode ? '#9ca3af' : '#374151'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#374151'} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: darkMode ? '#f9fafb' : '#111827' }} />
              <Line type='monotone' dataKey='value' stroke='#22c55e' strokeWidth={3} dot activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </AnimatedChartCard>

        <AnimatedChartCard title='Net Return' subtitle='$3,370.80' darkMode={darkMode}>
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={netReturnData} className='pointer-events-none'>
              <CartesianGrid strokeDasharray='3 3' stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey='quarter' stroke={darkMode ? '#9ca3af' : '#374151'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#374151'} />
              <Bar dataKey='value' fill='#16a34a' radius={[6, 6, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </AnimatedChartCard>

        <AnimatedChartCard title='Cashflow History' darkMode={darkMode}>
          <ResponsiveContainer width='100%' height={220}>
            <LineChart data={cashflowData}>
              <CartesianGrid strokeDasharray='3 3' stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey='quarter' stroke={darkMode ? '#9ca3af' : '#374151'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#374151'} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: darkMode ? '#f9fafb' : '#111827' }} />
              <Line type='monotone' dataKey='value' stroke='#2563eb' strokeWidth={3} dot activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </AnimatedChartCard>

        <AnimatedChartCard title='Portfolio Allocation' darkMode={darkMode}>
          <ResponsiveContainer width='100%' height={220}>
            <PieChart>
              <Pie data={portfolioAllocation} dataKey='value' outerRadius={80} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`} isAnimationActive>
                {portfolioAllocation.map((entry, index) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}
              </Pie>
              <Legend layout='vertical' align='right' verticalAlign='middle' iconType='square' formatter={(value, _entry, index) => (<span style={{ color: COLORS[index % COLORS.length] }}>{value}</span>)} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: darkMode ? '#f9fafb' : '#111827' }} />
            </PieChart>
          </ResponsiveContainer>
        </AnimatedChartCard>

        <AnimatedChartCard title='Performance Trend' darkMode={darkMode}>
          <ResponsiveContainer width='100%' height={220}>
            <AreaChart data={performanceTrend}>
              <defs>
                <linearGradient id='colorValue' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.8} />
                  <stop offset='95%' stopColor='#3b82f6' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey='month' stroke={darkMode ? '#9ca3af' : '#374151'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#374151'} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: darkMode ? '#f9fafb' : '#111827' }} />
              <Area type='monotone' dataKey='value' stroke='#3b82f6' fillOpacity={1} fill='url(#colorValue)' isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </AnimatedChartCard>

        <AnimatedChartCard title='Risk Analysis' darkMode={darkMode}>
          <ResponsiveContainer width='100%' height={260}>
            <RadarChart cx='50%' cy='50%' outerRadius='80%' data={riskAnalysisData}>
              <PolarGrid stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <PolarAngleAxis dataKey='category' stroke={darkMode ? '#9ca3af' : '#374151'} />
              <PolarRadiusAxis stroke={darkMode ? '#9ca3af' : '#374151'} />
              <Radar name='Risk Score A' dataKey='A' stroke='#ef4444' fill='#ef4444' fillOpacity={0.6} isAnimationActive />
              <Radar name='Risk Score B' dataKey='B' stroke='#3b82f6' fill='#3b82f6' fillOpacity={0.6} isAnimationActive />
              <Legend />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: darkMode ? '#f9fafb' : '#111827' }} />
            </RadarChart>
          </ResponsiveContainer>
        </AnimatedChartCard>
      </div>
    </div>
  )
}
