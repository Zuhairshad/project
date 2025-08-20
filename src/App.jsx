import { useState } from 'react'
import { Bell, Moon, Sun } from 'lucide-react'
import OverviewSection from './components/Overview/OverviewSection.jsx'
import DocumentsSection from './components/Documents/DocumentsSection.jsx'
import DistributionsSection from './components/Distributions/DistributionsSection.jsx' 
import { baseDocuments } from './lib/demoData.js'

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [timeframe, setTimeframe] = useState('Quarterly')
  const [darkMode, setDarkMode] = useState(false)

  const [docs, setDocs] = useState(baseDocuments)
  const [docSearch, setDocSearch] = useState('')
  const [docType, setDocType] = useState('All')
  const [sortBy, setSortBy] = useState('updated_desc')
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [viewMode, setViewMode] = useState('List')

  const tooltipStyle = darkMode
    ? { backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f9fafb' }
    : { backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#111827' }

  const tabs = ['Overview', 'Documents', 'Distributions']

  const filteredDocs = docs
    .filter((d) => (docType === 'All' || d.type === docType))
    .filter((d) => {
      const q = docSearch.trim().toLowerCase()
      if (!q) return true
      return (
        d.name.toLowerCase().includes(q) ||
        d.owner.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      if (sortBy === 'updated_desc') return new Date(b.updated) - new Date(a.updated)
      if (sortBy === 'updated_asc') return new Date(a.updated) - new Date(b.updated)
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
      return 0
    })

  return (
    <div className={darkMode ? 'min-h-screen bg-gray-900 text-gray-100 grid grid-rows-[auto,1fr]' : 'min-h-screen bg-gray-100 text-gray-900 grid grid-rows-[auto,1fr]'}>
      <header className={darkMode ? 'bg-gray-800 shadow px-6 py-4 flex items-center justify-between' : 'bg-white shadow px-6 py-4 flex items-center justify-between'}>
        <h1 className='text-xl font-bold'>Shad&apos;s Dashboard</h1>
        <div className='flex items-center space-x-4'>
          <input type='text' placeholder='Global search...' className='px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring focus:border-green-500' />
          <button className='relative' aria-label='Notifications'>
            <Bell className='w-5 h-5' />
            <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1'>3</span>
          </button>
          <button onClick={() => setDarkMode(!darkMode)} aria-label='Toggle theme'>
            {darkMode ? <Sun className='w-5 h-5' /> : <Moon className='w-5 h-5' />}
          </button>
          <div className='flex items-center space-x-2 cursor-pointer'>
            <img src='https://i.pravatar.cc/40' alt='User Avatar' className='w-8 h-8 rounded-full' />
            <span className='text-sm font-medium'>Zuhair Shad</span>
          </div>
        </div>
      </header>

      <div className='p-10 grid grid-cols-1 lg:grid-cols-4 gap-8'>
        <div className='lg:col-span-3'>
          <nav className='flex space-x-8 border-b border-gray-200 mb-8'>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? 'pb-2 text-sm font-medium border-b-2 border-green-600 text-green-600' : 'pb-2 text-sm font-medium text-gray-500 hover:text-gray-700'}
              >
                {tab}
              </button>
            ))}
          </nav>

          {activeTab === 'Overview' && (
            <OverviewSection
              darkMode={darkMode}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              tooltipStyle={tooltipStyle}
            />
          )}

          {activeTab === 'Documents' && (
            <DocumentsSection
              darkMode={darkMode}
              docs={filteredDocs}
              allDocs={docs}
              setDocs={setDocs}
              docSearch={docSearch}
              setDocSearch={setDocSearch}
              docType={docType}
              setDocType={setDocType}
              sortBy={sortBy}
              setSortBy={setSortBy}
              selectedDoc={selectedDoc}
              setSelectedDoc={setSelectedDoc}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          )}

          {activeTab === 'Distributions' && <DistributionsSection dark={darkMode} />} {/* ⬅️ NEW */}
        </div>

        <aside className={darkMode ? 'bg-gray-800 shadow rounded-lg p-6 text-sm space-y-6 h-fit divide-y divide-gray-700' : 'bg-white shadow rounded-lg p-6 text-sm space-y-6 h-fit divide-y divide-gray-200'}>
          <div>
            <h2 className='text-gray-500 uppercase text-xs mb-1 font-bold'>Company Address</h2>
            <p>They think I&apos;m hiding in the shadows but I am the shadows</p>
            <p className='font-bold'>Gotham City</p> {/* fixed invalid JSX */}
          </div>
          <div className='pt-4'><h2 className='text-gray-500 uppercase text-xs mb-1 font-bold'>Point of Contact</h2><p>Zuhair Shad</p><p>Investor Relations</p></div>
          <div className='pt-4'><h2 className='text-gray-500 uppercase text-xs mb-1 font-bold'>Phone/Fax</h2><p>Sorry</p></div>
          <div className='pt-4'><h2 className='text-gray-500 uppercase text-xs mb-1 font-bold'>Email</h2><p className='text-blue-400'>zuhairshad140@gmail.com</p></div>
          <div className='pt-4'><h2 className='text-gray-500 uppercase text-xs mb-1 font-bold'>Website</h2><p className='text-blue-400'>https://batman.com</p></div>
        </aside>
      </div>
    </div>
  )
}
