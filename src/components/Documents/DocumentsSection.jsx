import { useState, useRef, useEffect } from 'react'
import { Download, Share2, Link as LinkIcon, MoreVertical, Upload, Filter as FilterIcon, LayoutGrid, Rows, Trash2, RotateCcw, RotateCw } from 'lucide-react'
import { iconForType, formatDate, prettySize } from '../../lib/utils.js'

export default function DocumentsSection({ darkMode, docs, allDocs, setDocs, docSearch, setDocSearch, docType, setDocType, sortBy, setSortBy, selectedDoc, setSelectedDoc, viewMode, setViewMode }) {
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [selectedTrashIds, setSelectedTrashIds] = useState(new Set())
  const [showTrash, setShowTrash] = useState(false)
  const [trash, setTrash] = useState([])
  const [historyPast, setHistoryPast] = useState([])
  const [historyFuture, setHistoryFuture] = useState([])
  const [toast, setToast] = useState(null)
  const inputRef = useRef(null)

  const deep = (o) => JSON.parse(JSON.stringify(o))
  const snapshot = () => ({ docs: deep(allDocs), trash: deep(trash), selectedDocId: selectedDoc?.id ?? null })
  const applySnapshot = (s) => {
    setDocs(s.docs)
    setTrash(s.trash)
    const nextSel = s.selectedDocId ? s.docs.find((d) => d.id === s.selectedDocId) : null
    setSelectedDoc(nextSel || null)
    setSelectedIds(new Set())
    setSelectedTrashIds(new Set())
  }

  const showToastMsg = (message) => {
    if (toast?.timer) clearTimeout(toast.timer)
    const timer = setTimeout(() => setToast(null), 4000)
    setToast({ message, timer })
  }

  const commit = (label, fn) => {
    setHistoryPast((p) => [...p, snapshot()])
    setHistoryFuture([])
    fn()
    showToastMsg(label + ' • Undo available')
  }

  const undo = () => {
    if (!historyPast.length) return
    const curr = snapshot()
    const prev = historyPast[historyPast.length - 1]
    setHistoryPast((p) => p.slice(0, -1))
    setHistoryFuture((f) => [...f, curr])
    applySnapshot(prev)
  }

  const redo = () => {
    if (!historyFuture.length) return
    const curr = snapshot()
    const next = historyFuture[historyFuture.length - 1]
    setHistoryFuture((f) => f.slice(0, -1))
    setHistoryPast((p) => [...p, curr])
    applySnapshot(next)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault()
          if (e.shiftKey) redo(); else undo();
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [historyPast, historyFuture, allDocs, trash])

  const toggleId = (id, checked) => setSelectedIds((prev) => { const next = new Set(prev); if (checked) next.add(id); else next.delete(id); return next })
  const allVisibleIds = docs.map((d) => d.id)
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id))
  const onSelectAll = (checked) => { if (checked) setSelectedIds(new Set(allVisibleIds)); else setSelectedIds(new Set()) }

  const toggleTrashId = (id, checked) => setSelectedTrashIds((prev) => { const next = new Set(prev); if (checked) next.add(id); else next.delete(id); return next })
  const allTrashIds = trash.map((t) => t.id)
  const allTrashSelected = allTrashIds.length > 0 && allTrashIds.every((id) => selectedTrashIds.has(id))
  const onSelectAllTrash = (checked) => { if (checked) setSelectedTrashIds(new Set(allTrashIds)); else setSelectedTrashIds(new Set()) }

  const deleteOne = (id) => {
    commit('Deleted 1 item', () => {
      setDocs((prev) => {
        const target = prev.find((d) => d.id === id)
        if (target) setTrash((t) => [{ ...target, deletedAt: new Date().toISOString() }, ...t])
        return prev.filter((d) => d.id !== id)
      })
      if (selectedDoc?.id === id) setSelectedDoc(null)
      setSelectedIds((s) => { const n = new Set(s); n.delete(id); return n })
    })
  }

  const onDeleteSelected = () => {
    if (!selectedIds.size) return
    commit(`Deleted ${selectedIds.size} item(s)`, () => {
      setDocs((prev) => {
        const toMove = prev.filter((d) => selectedIds.has(d.id))
        if (toMove.length) setTrash((t) => [...toMove.map((x) => ({ ...x, deletedAt: new Date().toISOString() })), ...t])
        return prev.filter((d) => !selectedIds.has(d.id))
      })
      if (selectedDoc && selectedIds.has(selectedDoc.id)) setSelectedDoc(null)
      setSelectedIds(new Set())
    })
  }

  const restoreOne = (id) => {
    commit('Restored 1 item', () => {
      setTrash((prev) => {
        const item = prev.find((x) => x.id === id)
        if (item) setDocs((d) => [item, ...d])
        return prev.filter((x) => x.id !== id)
      })
      setSelectedTrashIds((s) => { const n = new Set(s); n.delete(id); return n })
    })
  }

  const restoreSelected = () => {
    if (!selectedTrashIds.size) return
    commit(`Restored ${selectedTrashIds.size} item(s)`, () => {
      setTrash((prev) => {
        const keep = []; const move = [];
        for (const it of prev) { if (selectedTrashIds.has(it.id)) move.push(it); else keep.push(it) }
        if (move.length) setDocs((d) => [...move, ...d])
        return keep
      })
      setSelectedTrashIds(new Set())
    })
  }

  const deletePermanentOne = (id) => {
    commit('Permanently deleted 1 item', () => {
      setTrash((prev) => prev.filter((x) => x.id !== id))
      setSelectedTrashIds((s) => { const n = new Set(s); n.delete(id); return n })
    })
  }

  const deletePermanentSelected = () => {
    if (!selectedTrashIds.size) return
    commit(`Permanently deleted ${selectedTrashIds.size} item(s)`, () => {
      setTrash((prev) => prev.filter((x) => !selectedTrashIds.has(x.id)))
      setSelectedTrashIds(new Set())
    })
  }

  const emptyTrash = () => { if (!trash.length) return; commit('Emptied Trash', () => setTrash([])) }

  const downloadOne = (doc) => {
    try {
      if (doc.url) {
        const a = document.createElement('a')
        a.href = doc.url; a.target = '_blank'; a.rel = 'noopener'; a.download = doc.name
        document.body.appendChild(a); a.click(); document.body.removeChild(a); return
      }
      const meta = { name: doc.name, type: doc.type, size: doc.size, updated: doc.updated, owner: doc.owner, tags: doc.tags, status: doc.status, note: 'Demo export' }
      const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); const base = doc.name.replace(/\.[^.]+$/, '')
      a.href = url; a.download = `${base} - demo.json`
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch (e) { console.error(e); alert('Download failed in demo.') }
  }

  const onDownloadSelected = () => {
    const ids = Array.from(selectedIds); if (!ids.length) return
    ids.forEach((id) => { const doc = allDocs.find((d) => d.id === id); if (doc) downloadOne(doc) })
  }

  const onShareSelected = () => { const ids = Array.from(selectedIds); alert(`${ids.length} item(s) ready to share (demo).`) }

  const onFilesAdded = (fileList) => {
    const files = Array.from(fileList || []); if (!files.length) return
    const now = new Date()
    const added = files.map((f, i) => ({ id: Date.now() + i, name: f.name, type: extToType(f.name), size: prettySize(f.size), updated: now.toISOString().slice(0,10), owner: 'You', tags: ['Uploaded'], status: 'Draft', url: undefined }))
    commit(`Uploaded ${added.length} file(s)`, () => setDocs((prev) => [...added, ...prev]))
  }

  const extToType = (name) => {
    const ext = name.split('.').pop().toLowerCase()
    if (ext === 'pdf') return 'PDF'
    if (['xls','xlsx'].includes(ext)) return 'XLSX'
    if (['doc','docx'].includes(ext)) return 'DOCX'
    if (['ppt','pptx'].includes(ext)) return 'PPTX'
    return 'PDF'
  }

  const onDrop = (e) => { e.preventDefault(); e.stopPropagation(); onFilesAdded(e.dataTransfer.files) }
  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation() }

  return (
    <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
      <div className='xl:col-span-2 space-y-4'>
        <div className={darkMode ? 'bg-gray-800 rounded-lg p-4 shadow' : 'bg-white rounded-lg p-4 shadow'}>
          <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
            <div className='flex-1 flex items-center gap-2'>
              <input value={docSearch} onChange={(e) => setDocSearch(e.target.value)} placeholder='Search documents, tags, owner...' className={darkMode ? 'w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 placeholder-gray-500 focus:outline-none' : 'w-full px-3 py-2 rounded-md bg-white border border-gray-200 placeholder-gray-400 focus:outline-none'} />
              <button className={darkMode ? 'px-3 py-2 bg-gray-700 rounded-md' : 'px-3 py-2 bg-gray-100 rounded-md'} title='Filters'><FilterIcon className='w-4 h-4' /></button>
            </div>
            <div className='flex items-center gap-2'>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className={darkMode ? 'px-2 py-2 rounded-md bg-gray-900 border border-gray-700' : 'px-2 py-2 rounded-md bg-white border border-gray-200'}>
                {'All PDF DOCX XLSX PPTX'.split(' ').map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={darkMode ? 'px-2 py-2 rounded-md bg-gray-900 border border-gray-700' : 'px-2 py-2 rounded-md bg-white border border-gray-200'}>
                <option value='updated_desc'>Updated ↓</option>
                <option value='updated_asc'>Updated ↑</option>
                <option value='name_asc'>Name A→Z</option>
                <option value='name_desc'>Name Z→A</option>
              </select>
              <div className='flex items-center gap-1 border rounded-md overflow-hidden'>
                <button className={`px-2 py-2 ${viewMode === 'List' ? 'bg-green-600 text-white' : darkMode ? 'bg-gray-900' : 'bg-white'}`} onClick={() => setViewMode('List')} title='List view'><Rows className='w-4 h-4' /></button>
                <button className={`px-2 py-2 ${viewMode === 'Grid' ? 'bg-green-600 text-white' : darkMode ? 'bg-gray-900' : 'bg-white'}`} onClick={() => setViewMode('Grid')} title='Grid view'><LayoutGrid className='w-4 h-4' /></button>
              </div>
              <div className='flex items-center gap-1 border rounded-md overflow-hidden'>
                <button onClick={undo} disabled={!historyPast.length} className={`px-2 py-2 ${historyPast.length ? (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100') : 'opacity-40 cursor-not-allowed'}`} title='Undo (Ctrl/Cmd+Z)'><RotateCcw className='w-4 h-4' /></button>
                <button onClick={redo} disabled={!historyFuture.length} className={`px-2 py-2 ${historyFuture.length ? (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100') : 'opacity-40 cursor-not-allowed'}`} title='Redo (Ctrl/Cmd+Shift+Z)'><RotateCw className='w-4 h-4' /></button>
              </div>
              <button onClick={() => inputRef.current?.click()} className='inline-flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 text-white'><Upload className='w-4 h-4' />Upload</button>
              <input ref={inputRef} type='file' multiple className='hidden' onChange={(e) => onFilesAdded(e.target.files)} />
              <button onClick={() => setShowTrash((s) => !s)} className={showTrash ? 'inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 text-white' : 'inline-flex items-center gap-2 px-3 py-2 rounded-md border'} title='Open Trash'><Trash2 className='w-4 h-4' />{showTrash ? 'Close Trash' : `Trash (${trash.length})`}</button>
              {showTrash && (<button onClick={() => emptyTrash()} className='px-3 py-2 rounded-md border' title='Empty Trash'>Empty</button>)}
            </div>
          </div>
        </div>

        {!showTrash && (
          <div onDrop={onDrop} onDragOver={onDragOver} className={darkMode ? 'border-2 border-dashed border-gray-700 rounded-lg p-6 text-sm text-gray-400' : 'border-2 border-dashed border-gray-300 rounded-lg p-6 text-sm text-gray-500'}>
            Drag & drop files here, or click <button className='underline' onClick={() => inputRef.current?.click()}>browse</button> to upload.
          </div>
        )}

        {!showTrash && selectedIds.size > 0 && (
          <div className={darkMode ? 'bg-gray-800 border border-gray-700 rounded-lg p-3 sticky top-2 z-10' : 'bg-white border border-gray-200 rounded-lg p-3 sticky top-2 z-10'}>
            <div className='flex items-center justify-between text-sm'>
              <span>{selectedIds.size} selected</span>
              <div className='flex items-center gap-2'>
                <button onClick={() => onDownloadSelected()} className='px-2 py-1 rounded border inline-flex items-center gap-1'><Download className='w-4 h-4'/>Download</button>
                <button onClick={() => onShareSelected()} className='px-2 py-1 rounded border inline-flex items-center gap-1'><Share2 className='w-4 h-4'/>Share</button>
                <button onClick={() => onDeleteSelected()} className='px-2 py-1 rounded border inline-flex items-center gap-1 text-red-600'><Trash2 className='w-4 h-4'/>Delete</button>
              </div>
            </div>
          </div>
        )}

        {showTrash && selectedTrashIds.size > 0 && (
          <div className={darkMode ? 'bg-gray-800 border border-gray-700 rounded-lg p-3 sticky top-2 z-10' : 'bg-white border border-gray-200 rounded-lg p-3 sticky top-2 z-10'}>
            <div className='flex items-center justify-between text-sm'>
              <span>{selectedTrashIds.size} in trash selected</span>
              <div className='flex items-center gap-2'>
                <button onClick={() => restoreSelected()} className='px-2 py-1 rounded border'>Restore</button>
                <button onClick={() => deletePermanentSelected()} className='px-2 py-1 rounded border text-red-600'>Delete permanently</button>
              </div>
            </div>
          </div>
        )}

        {!showTrash ? (
          viewMode === 'List' ? (
            <DocsTable darkMode={darkMode} docs={docs} setSelectedDoc={setSelectedDoc} selectedIds={selectedIds} toggleId={toggleId} allSelected={allSelected} onSelectAll={onSelectAll} downloadOne={downloadOne} deleteOne={deleteOne} />
          ) : (
            <DocsGrid darkMode={darkMode} docs={docs} setSelectedDoc={setSelectedDoc} selectedIds={selectedIds} toggleId={toggleId} onSelectAll={onSelectAll} allSelected={allSelected} downloadOne={downloadOne} deleteOne={deleteOne} />
          )
        ) : (
          viewMode === 'List' ? (
            <TrashTable darkMode={darkMode} trash={trash} selectedTrashIds={selectedTrashIds} toggleTrashId={toggleTrashId} allTrashSelected={allTrashSelected} onSelectAllTrash={onSelectAllTrash} restoreOne={restoreOne} deletePermanentOne={deletePermanentOne} />
          ) : (
            <TrashGrid darkMode={darkMode} trash={trash} selectedTrashIds={selectedTrashIds} toggleTrashId={toggleTrashId} allTrashSelected={allTrashSelected} onSelectAllTrash={onSelectAllTrash} restoreOne={restoreOne} deletePermanentOne={deletePermanentOne} />
          )
        )}
      </div>

      <DetailsPanel darkMode={darkMode} selectedDoc={selectedDoc} downloadOne={downloadOne} deleteOne={deleteOne} />
    </div>
  )
}

function DetailsPanel({ darkMode, selectedDoc, downloadOne, deleteOne }) {
  if (!selectedDoc) return <div className={darkMode ? 'bg-gray-800 rounded-lg p-6 shadow h-fit text-sm text-gray-500' : 'bg-white rounded-lg p-6 shadow h-fit text-sm text-gray-500'}>Select a document to see details.</div>
  return (
    <div className={darkMode ? 'bg-gray-800 rounded-lg p-6 shadow h-fit' : 'bg-white rounded-lg p-6 shadow h-fit'}>
      <div className='space-y-4'>
        <div className='flex items-start justify-between'>
          <div>
            <h3 className='text-lg font-semibold flex items-center gap-2'>{/* icon in list */}{selectedDoc.name}</h3>
            <p className='text-xs text-gray-500'>{selectedDoc.type} • {selectedDoc.size}</p>
          </div>
          <div className='flex items-center gap-2'>
            <button onClick={() => downloadOne(selectedDoc)} className='inline-flex items-center gap-1 px-2 py-1 rounded border'><Download className='w-4 h-4' />Download</button>
            <button className='inline-flex items-center gap-1 px-2 py-1 rounded border'><Share2 className='w-4 h-4' />Share</button>
       { /*    <button onClick={() => deleteOne(selectedDoc.id)} className='inline-flex items-center gap-1 px-2 py-1 rounded border text-red-600'><Trash2 className='w-4 h-4' />Delete</button> */}
          </div>
        </div>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div><p className='text-gray-500'>Owner</p><p>{selectedDoc.owner}</p></div>
          <div><p className='text-gray-500'>Last updated</p><p>{new Date(selectedDoc.updated).toLocaleDateString()}</p></div>
          <div><p className='text-gray-500'>Status</p><p>{selectedDoc.status}</p></div>
          <div><p className='text-gray-500'>Tags</p><div className='flex flex-wrap gap-1'>{selectedDoc.tags.map((t) => (<span key={t} className={darkMode ? 'px-2 py-0.5 text-xs rounded bg-gray-900 border border-gray-700' : 'px-2 py-0.5 text-xs rounded bg-gray-100 border border-gray-200'}>{t}</span>))}</div></div>
        </div>
        {selectedDoc.type === 'PDF' ? (
          selectedDoc.url ? (<iframe title='pdf-preview' src={selectedDoc.url} className='w-full h-72 rounded border' />) : (
            <div className={darkMode ? 'p-3 rounded bg-gray-900 border border-gray-700' : 'p-3 rounded bg-gray-50 border border-gray-200'}>
              <div className='text-xs text-gray-500'>PDF preview (demo placeholder). Attach a real URL in the doc object to embed.</div>
              <div className='mt-2 h-56 rounded bg-gradient-to-b from-gray-200/50 to-transparent dark:from-gray-700/30' />
            </div>
          )
        ) : (
          <div className={darkMode ? 'p-3 rounded bg-gray-900 border border-gray-700 text-xs' : 'p-3 rounded bg-gray-50 border border-gray-200 text-xs'}>
            Inline preview placeholder — previews for {selectedDoc.type} not implemented in this demo.
          </div>
        )}
      </div>
    </div>
  )
}

function DocsTable({ darkMode, docs, setSelectedDoc, selectedIds, toggleId, allSelected, onSelectAll, downloadOne, deleteOne }) {
  return (
    <div className={darkMode ? 'bg-gray-800 rounded-lg p-4 shadow overflow-auto' : 'bg-white rounded-lg p-4 shadow overflow-auto'}>
      <table className='w-full text-sm'>
        <thead>
          <tr className='text-left text-gray-500'>
            <th className='py-2 w-8'><input type='checkbox' checked={allSelected} onChange={(e) => onSelectAll(e.target.checked)} /></th>
            <th className='py-2'>Name</th>
            <th className='py-2'>Type</th>
            <th className='py-2'>Updated</th>
            <th className='py-2'>Size</th>
            <th className='py-2'>Owner</th>
            <th className='py-2'>Tags</th>
            <th className='py-2 text-right'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id} className={darkMode ? 'border-t border-gray-700 hover:bg-gray-700/50' : 'border-t border-gray-200 hover:bg-gray-50'} onClick={() => setSelectedDoc(d)}>
              <td className='py-3 w-8' onClick={(e) => e.stopPropagation()}>
                <input type='checkbox' checked={selectedIds.has(d.id)} onChange={(e) => toggleId(d.id, e.target.checked)} />
              </td>
              <td className='py-3 flex items-center gap-2'>
                {iconForType(d.type)}
                <span className='font-medium truncate max-w-[260px]' title={d.name}>{d.name}</span>
              </td>
              <td className='py-3'>{d.type}</td>
              <td className='py-3'>{formatDate(d.updated)}</td>
              <td className='py-3'>{d.size}</td>
              <td className='py-3'>{d.owner}</td>
              <td className='py-3'>
                <div className='flex flex-wrap gap-1'>
                  {d.tags.map((t) => (<span key={t} className={darkMode ? 'px-2 py-0.5 text-xs rounded bg-gray-900 border border-gray-700' : 'px-2 py-0.5 text-xs rounded bg-gray-100 border border-gray-200'}>{t}</span>))}
                </div>
              </td>
              <td className='py-3 text-right' onClick={(e) => e.stopPropagation()}>
                <div className='inline-flex items-center gap-1'>
                  <button className={darkMode ? 'p-1 rounded hover:bg-gray-600' : 'p-1 rounded hover:bg-gray-200'} title='Download' onClick={() => downloadOne(d)}><Download className='w-4 h-4' /></button>
                  <button className={darkMode ? 'p-1 rounded hover:bg-gray-600 text-red-400' : 'p-1 rounded hover:bg-gray-200 text-red-600'} title='Delete' onClick={() => deleteOne(d.id)}><Trash2 className='w-4 h-4' /></button>
                  <button className={darkMode ? 'p-1 rounded hover:bg-gray-600' : 'p-1 rounded hover:bg-gray-200'} title='More'><MoreVertical className='w-4 h-4' /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DocsGrid({ darkMode, docs, setSelectedDoc, selectedIds, toggleId, onSelectAll, allSelected, downloadOne, deleteOne }) {
  return (
    <div className={darkMode ? 'bg-gray-800 rounded-lg p-4 shadow' : 'bg-white rounded-lg p-4 shadow'}>
      <div className='flex items-center justify-between mb-3 text-sm'>
        <div className='flex items-center gap-2'>
          <input type='checkbox' checked={allSelected} onChange={(e) => onSelectAll(e.target.checked)} />
          <span>Select all</span>
        </div>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {docs.map((d) => (
          <div key={d.id} className={darkMode ? 'rounded-lg border border-gray-700 p-4 hover:bg-gray-700/50' : 'rounded-lg border border-gray-200 p-4 hover:bg-gray-50'} onClick={() => setSelectedDoc(d)}>
            <div className='flex items-start justify-between'>
              <div className='flex items-center gap-2'>
                {iconForType(d.type)}
                <div className='font-medium truncate' title={d.name}>{d.name}</div>
              </div>
              <input type='checkbox' checked={selectedIds.has(d.id)} onChange={(e) => { e.stopPropagation(); toggleId(d.id, e.target.checked) }} onClick={(e) => e.stopPropagation()} />
            </div>
            <div className='mt-3 text-xs text-gray-500'>{d.type} • {formatDate(d.updated)} • {d.size}</div>
            <div className='mt-2 flex flex-wrap gap-1'>
              {d.tags.map((t) => (<span key={t} className={darkMode ? 'px-2 py-0.5 text-xs rounded bg-gray-900 border border-gray-700' : 'px-2 py-0.5 text-xs rounded bg-gray-100 border border-gray-200'}>{t}</span>))}
            </div>
            <div className='mt-3 flex items-center gap-2'>
              <button className={darkMode ? 'px-2 py-1 rounded bg-gray-700 text-xs' : 'px-2 py-1 rounded bg-gray-100 text-xs'} onClick={(e) => { e.stopPropagation(); downloadOne(d) }}>Download</button>
              <button className={darkMode ? 'px-2 py-1 rounded bg-gray-700 text-xs text-red-300' : 'px-2 py-1 rounded bg-gray-100 text-xs text-red-600'} onClick={(e) => { e.stopPropagation(); deleteOne(d.id) }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrashTable({ darkMode, trash, selectedTrashIds, toggleTrashId, allTrashSelected, onSelectAllTrash, restoreOne, deletePermanentOne }) {
  return (
    <div className={darkMode ? 'bg-gray-800 rounded-lg p-4 shadow overflow-auto' : 'bg-white rounded-lg p-4 shadow overflow-auto'}>
      <table className='w-full text-sm'>
        <thead>
          <tr className='text-left text-gray-500'>
            <th className='py-2 w-8'><input type='checkbox' checked={allTrashSelected} onChange={(e) => onSelectAllTrash(e.target.checked)} /></th>
            <th className='py-2'>Name</th>
            <th className='py-2'>Type</th>
            <th className='py-2'>Deleted</th>
            <th className='py-2'>Size</th>
            <th className='py-2 text-right'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trash.map((d) => (
            <tr key={d.id} className={darkMode ? 'border-t border-gray-700 hover:bg-gray-700/50' : 'border-t border-gray-200 hover:bg-gray-50'}>
              <td className='py-3 w-8'><input type='checkbox' checked={selectedTrashIds.has(d.id)} onChange={(e) => toggleTrashId(d.id, e.target.checked)} /></td>
              <td className='py-3 flex items-center gap-2'>{iconForType(d.type)}<span className='font-medium truncate max-w-[260px]' title={d.name}>{d.name}</span></td>
              <td className='py-3'>{d.type}</td>
              <td className='py-3'>{new Date(d.deletedAt || Date.now()).toLocaleDateString()}</td>
              <td className='py-3'>{d.size}</td>
              <td className='py-3 text-right'>
                <div className='inline-flex items-center gap-1'>
                  <button className={darkMode ? 'p-1 rounded hover:bg-gray-600' : 'p-1 rounded hover:bg-gray-200'} title='Restore' onClick={() => restoreOne(d.id)}>Restore</button>
                  <button className={darkMode ? 'p-1 rounded hover:bg-gray-600 text-red-400' : 'p-1 rounded hover:bg-gray-200 text-red-600'} title='Delete permanently' onClick={() => deletePermanentOne(d.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrashGrid({ darkMode, trash, selectedTrashIds, toggleTrashId, allTrashSelected, onSelectAllTrash, restoreOne, deletePermanentOne }) {
  return (
    <div className={darkMode ? 'bg-gray-800 rounded-lg p-4 shadow' : 'bg-white rounded-lg p-4 shadow'}>
      <div className='flex items-center justify-between mb-3 text-sm'>
        <div className='flex items-center gap-2'>
          <input type='checkbox' checked={allTrashSelected} onChange={(e) => onSelectAllTrash(e.target.checked)} />
          <span>Select all</span>
        </div>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {trash.map((d) => (
          <div key={d.id} className={darkMode ? 'rounded-lg border border-gray-700 p-4 hover:bg-gray-700/50' : 'rounded-lg border border-gray-200 p-4 hover:bg-gray-50'}>
            <div className='flex items-start justify-between'>
              <div className='flex items-center gap-2'>{iconForType(d.type)}<div className='font-medium truncate' title={d.name}>{d.name}</div></div>
              <input type='checkbox' checked={selectedTrashIds.has(d.id)} onChange={(e) => toggleTrashId(d.id, e.target.checked)} />
            </div>
            <div className='mt-3 text-xs text-gray-500'>Deleted • {new Date(d.deletedAt || Date.now()).toLocaleDateString()} • {d.size}</div>
            <div className='mt-3 flex items-center gap-2'>
              <button className={darkMode ? 'px-2 py-1 rounded bg-gray-700 text-xs' : 'px-2 py-1 rounded bg-gray-100 text-xs'} onClick={() => restoreOne(d.id)}>Restore</button>
              <button className={darkMode ? 'px-2 py-1 rounded bg-gray-700 text-xs text-red-300' : 'px-2 py-1 rounded bg-gray-100 text-xs text-red-600'} onClick={() => deletePermanentOne(d.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
