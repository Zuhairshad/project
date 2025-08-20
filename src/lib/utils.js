import { FileText, FileSpreadsheet, File } from 'lucide-react'

export function formatDate(s) {
  const d = new Date(s)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

export function prettySize(bytes) {
  if (typeof bytes !== 'number') return bytes || ''
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export function iconForType(t) {
  if (t === 'PDF') return <FileText className='w-4 h-4 text-red-500' />
  if (t === 'XLSX') return <FileSpreadsheet className='w-4 h-4 text-green-600' />
  if (t === 'DOCX') return <FileText className='w-4 h-4 text-blue-600' />
  if (t === 'PPTX') return <File className='w-4 h-4 text-orange-500' />
  return <File className='w-4 h-4 text-gray-500' />
}
