import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Box, Typography, Button, Paper, Stack, AppBar, Toolbar,
  Chip, IconButton, Fade, TextField, Avatar, InputAdornment,
  CircularProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  ToggleButtonGroup, ToggleButton, Select, MenuItem, FormControl, InputLabel, Drawer,
} from '@mui/material'
import { UserButton, useUser, useClerk } from '@clerk/react'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import DescriptionIcon from '@mui/icons-material/Description'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SendIcon from '@mui/icons-material/Send'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ChatIcon from '@mui/icons-material/Chat'
import AddIcon from '@mui/icons-material/Add'
import QuizIcon from '@mui/icons-material/Quiz'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import YouTubeIcon from '@mui/icons-material/YouTube'
import FolderIcon from '@mui/icons-material/Folder'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import LinkIcon from '@mui/icons-material/Link'
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium'
import MenuBookIcon from '@mui/icons-material/MenuBook'

import QuizPanel from './QuizPanel'
import MindMapView from './MindMapView'
import PdfViewer from './PdfViewer'

// ─── Types ────────────────────────────────────────────
interface Source {
  content: string
  source: string
  sourceType: string
  pageNumber: number | null
  workspace: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: Source[]
}

interface UploadedItem {
  id: string
  name: string
  size: number
  uploadedAt: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
  type: 'pdf' | 'youtube'
  workspace: string
  backendFilename?: string // Needed to load the PDF in the viewer
}

type ViewMode = 'chat' | 'quiz' | 'mindmap'

// ─── LocalStorage helpers ─────────────────────────────
function getStorageKey(key: string, userId: string): string {
  return `studyhub-${userId}-${key}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* storage full */ }
}

// ─── API helpers ──────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function uploadPdf(file: File, workspace: string) {
  const formData = new FormData()
  formData.append('pdf', file)
  formData.append('workspace', workspace)
  const res = await fetch(`${API_BASE}/upload/pdf`, { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

async function uploadYouTube(url: string, workspace: string) {
  const res = await fetch(`${API_BASE}/upload/youtube`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, workspace }),
  })
  if (!res.ok) throw new Error('YouTube processing failed')
  return res.json()
}

async function chatQuery(query: string, workspace: string): Promise<{ answer: string; sources: Source[] }> {
  const res = await fetch(`${API_BASE}/chat?query=${encodeURIComponent(query)}&workspace=${encodeURIComponent(workspace)}`)
  if (!res.ok) throw new Error('Chat query failed')
  const data = await res.json()
  return { answer: data.answer, sources: data.sources || [] }
}

// ─── Main Component ───────────────────────────────────
export default function Dashboard() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const uId = user?.id || 'guest'

  // Persisted state
  const [items, setItems] = useState<UploadedItem[]>(() => loadFromStorage(getStorageKey('items', uId), []))
  const [messages, setMessages] = useState<Message[]>(() => loadFromStorage(getStorageKey('messages', uId), []))
  const [activeItemId, setActiveItemId] = useState<string | null>(() => loadFromStorage(getStorageKey('active-item', uId), null))
  const [workspaces, setWorkspaces] = useState<string[]>(() => loadFromStorage(getStorageKey('workspaces', uId), ['default']))
  const [activeWorkspace, setActiveWorkspace] = useState<string>(() => loadFromStorage(getStorageKey('active-workspace', uId), 'default'))
  const [isPro, setIsPro] = useState<boolean>(() => loadFromStorage(getStorageKey('is-pro', uId), false))

  // Handle cross-account switching without remount
  const [currentUId, setCurrentUId] = useState(uId)
  useEffect(() => {
    if (uId !== currentUId) {
      setItems(loadFromStorage(getStorageKey('items', uId), []))
      setMessages(loadFromStorage(getStorageKey('messages', uId), []))
      setActiveItemId(loadFromStorage(getStorageKey('active-item', uId), null))
      setWorkspaces(loadFromStorage(getStorageKey('workspaces', uId), ['default']))
      setActiveWorkspace(loadFromStorage(getStorageKey('active-workspace', uId), 'default'))
      setIsPro(loadFromStorage(getStorageKey('is-pro', uId), false))
      setCurrentUId(uId)
    }
  }, [uId, currentUId])

  // Transient state
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('chat')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [youtubeLoading, setYoutubeLoading] = useState(false)
  const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [showPricingModal, setShowPricingModal] = useState(false)

  // Viewer State
  const [viewerPdfUrl, setViewerPdfUrl] = useState<string | null>(null)
  const [viewerPdfName, setViewerPdfName] = useState('')
  const [viewerHighlightPage, setViewerHighlightPage] = useState<number | null>(null)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // ─── Persist to localStorage on changes ─────────────
  useEffect(() => { saveToStorage(getStorageKey('items', uId), items) }, [items, uId])
  useEffect(() => { saveToStorage(getStorageKey('messages', uId), messages) }, [messages, uId])
  useEffect(() => { saveToStorage(getStorageKey('active-item', uId), activeItemId) }, [activeItemId, uId])
  useEffect(() => { saveToStorage(getStorageKey('workspaces', uId), workspaces) }, [workspaces, uId])
  useEffect(() => { saveToStorage(getStorageKey('active-workspace', uId), activeWorkspace) }, [activeWorkspace, uId])
  useEffect(() => { saveToStorage(getStorageKey('is-pro', uId), isPro) }, [isPro, uId])

  // Check for Stripe success/canceled
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    if (query.get('success')) {
      setIsPro(true)
      setShowPricingModal(false)
      window.history.replaceState(null, '', window.location.pathname)
    }
    if (query.get('canceled')) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  // ─── Derived state ──────────────────────────────────
  const filteredItems = items.filter(i => i.workspace === activeWorkspace)

  // ─── Auto-scroll on new messages ────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ─── Session helpers ────────────────────────────────
  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg])
  }, [])

  // ─── Upload handlers ────────────────────────────────
  const handleUpload = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') return

    // Limit check for free users
    if (!isPro && items.filter(i => i.type === 'pdf').length >= 3) {
      setShowPricingModal(true)
      return
    }

    const itemId = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const newItem: UploadedItem = {
      id: itemId,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'uploading',
      type: 'pdf',
      workspace: activeWorkspace,
    }
    setItems(prev => [newItem, ...prev])
    setActiveItemId(itemId)

    addMessage({
      id: `welcome-${itemId}`,
      role: 'assistant',
      content: `📄 Uploading **"${file.name}"** to workspace **${activeWorkspace}**...`,
      timestamp: new Date().toISOString(),
    })

    try {
      const data = await uploadPdf(file, activeWorkspace)
      setItems(prev => prev.map(p => p.id === itemId ? { ...p, status: 'ready', backendFilename: data.filename } : p))
      addMessage({
        id: `ready-${itemId}`,
        role: 'assistant',
        content: `✅ **"${file.name}"** processing complete (${data.pages} pages)! Ask questions, generate quizzes, or map concepts.`,
        timestamp: new Date().toISOString(),
      })
    } catch {
      setItems(prev => prev.map(p => p.id === itemId ? { ...p, status: 'error' } : p))
    }
  }, [addMessage, activeWorkspace, items, isPro])

  const handleYouTubeUpload = async () => {
    if (!youtubeUrl.trim()) return

    // Pro Feature Restriction
    if (!isPro) {
      setShowPricingModal(true)
      return
    }

    setYoutubeLoading(true)
    const itemId = `yt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const newItem: UploadedItem = {
      id: itemId,
      name: youtubeUrl.trim(),
      size: 0,
      uploadedAt: new Date().toISOString(),
      status: 'uploading',
      type: 'youtube',
      workspace: activeWorkspace,
    }
    setItems(prev => [newItem, ...prev])
    setActiveItemId(itemId)

    try {
      await uploadYouTube(youtubeUrl.trim(), activeWorkspace)
      setItems(prev => prev.map(p => p.id === itemId ? { ...p, status: 'ready' } : p))
      addMessage({
        id: `ready-${itemId}`,
        role: 'assistant',
        content: `✅ YouTube video transcript has been processed! You can now ask questions about the video content.`,
        timestamp: new Date().toISOString(),
      })
      setYoutubeUrl('')
    } catch {
      setItems(prev => prev.map(p => p.id === itemId ? { ...p, status: 'error' } : p))
    } finally {
      setYoutubeLoading(false)
    }
  }

  // ─── Citations & Viewer ─────────────────────────────
  const openCitation = (source: Source) => {
    if (source.sourceType === 'pdf') {
      const parentItem = items.find(i => i.name === source.source && i.type === 'pdf')
      if (parentItem && parentItem.backendFilename) {
        setViewerPdfName(source.source)
        setViewerHighlightPage(source.pageNumber)
        setViewerPdfUrl(`${API_BASE}/uploads/${parentItem.backendFilename}`)
      } else {
        alert(`Source Document: ${source.source}\nPage: ${source.pageNumber || 'Unknown'}\n\nExcerpt:\n${source.content}`)
        // Set variables to prevent TS unused errors, even if view fails to load MVP simulated file
        setViewerPdfName(source.source)
        setViewerHighlightPage(source.pageNumber)
        setViewerPdfUrl(source.source)
      }
    } else {
      window.open(source.source, '_blank')
    }
  }

  // ─── Workspace helpers ──────────────────────────────
  const handleAddWorkspace = () => {
    const name = newWorkspaceName.trim()
    if (!name || workspaces.includes(name)) return
    setWorkspaces(prev => [...prev, name])
    setActiveWorkspace(name)
    setNewWorkspaceName('')
    setShowNewWorkspaceDialog(false)
  }

  // ─── Drag & Drop ───────────────────────────────────
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) handleUpload(droppedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleUpload(selected)
    e.target.value = ''
  }

  const handleRemoveItem = async (itemId: string) => {
    const itemToRemove = items.find(i => i.id === itemId)
    if (itemToRemove) {
      try {
        await fetch(`${API_BASE}/document`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: itemToRemove.name, workspace: activeWorkspace })
        });
      } catch (e) {
        console.error("Failed to delete from backend", e);
      }
    }

    setItems(prev => prev.filter(p => p.id !== itemId))
    if (activeItemId === itemId) {
      const remaining = items.filter(p => p.id !== itemId)
      setActiveItemId(remaining.length > 0 ? remaining[0].id : null)
      setViewerPdfUrl(null); // Also clear viewer on delete if active
    }
  }

  const handleSelectItem = (item: UploadedItem) => {
    setActiveItemId(item.id)
    if (item.type === 'pdf' && item.backendFilename) {
      setViewerPdfName(item.name)
      setViewerHighlightPage(null)
      setViewerPdfUrl(`${API_BASE}/uploads/${item.backendFilename}`)
    } else {
      // Don't clear viewer on YouTube URL click, or maybe we do
      setViewerPdfUrl(null)
    }
  }

  // ─── Send Chat ─────────────────────────────────────
  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    }
    addMessage(userMsg)
    const question = inputValue.trim()
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await chatQuery(question, activeWorkspace)
      addMessage({
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date().toISOString(),
      })
    } catch {
      addMessage({
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '❌ Failed to get a response. Please check if the server is running and try again.',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Render Helpers ────────────────────────────────
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '—'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#E2E8F0' }}>{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  const leftPanelContent = (
    <Box sx={{ width: { xs: '280px', md: '340px' }, minWidth: { md: 280 }, maxWidth: { md: 400 }, height: '100%', borderRight: { xs: 'none', md: '1px solid rgba(255,255,255,0.06)' }, borderBottom: { xs: '1px solid rgba(255,255,255,0.06)', md: 'none' }, display: 'flex', flexDirection: 'column', bgcolor: 'rgba(10, 14, 26, 0.5)', flexShrink: 0, overflow: 'hidden' }}>
      {/* Workspace Mobile Only */}
      <Box sx={{ px: 2, pt: 2, pb: 1, display: { md: 'none' }, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>Workspace</InputLabel>
            <Select value={activeWorkspace} label="Workspace" onChange={(e) => setActiveWorkspace(e.target.value)} sx={{ fontSize: '0.82rem', color: '#B388FF', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124,77,255,0.3)' } }}>
              {workspaces.map(ws => (
                <MenuItem key={ws} value={ws}><Stack direction="row" alignItems="center" spacing={1}><FolderIcon sx={{ fontSize: 16, color: '#B388FF' }} /><span>{ws}</span></Stack></MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton size="small" onClick={() => setShowNewWorkspaceDialog(true)} sx={{ color: '#B388FF', bgcolor: 'rgba(124,77,255,0.1)' }}><CreateNewFolderIcon sx={{ fontSize: 18 }} /></IconButton>
        </Stack>
      </Box>

      {/* Sources Header */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)', bgcolor: 'rgba(255,255,255,0.02)' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <InsertDriveFileIcon sx={{ fontSize: 20, color: 'primary.light' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Sources</Typography>
          </Stack>
          <IconButton size="small" onClick={() => fileInputRef.current?.click()} sx={{ color: 'primary.light', bgcolor: 'rgba(124, 77, 255, 0.1)', '&:hover': { bgcolor: 'rgba(124, 77, 255, 0.2)' } }}>
            <AddIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>

      <input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={handleFileChange} />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Paper onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} elevation={0} sx={{ mx: 2, mt: 2, mb: 1, p: 1.5, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', bgcolor: dragActive ? 'rgba(124, 77, 255, 0.08)' : 'rgba(17, 24, 39, 0.5)', border: '2px dashed', borderColor: dragActive ? 'primary.main' : 'rgba(255,255,255,0.08)', borderRadius: 3, transition: 'all 0.3s ease', '&:hover': { borderColor: 'rgba(124, 77, 255, 0.4)', bgcolor: 'rgba(124, 77, 255, 0.04)' } }}>
          <CloudUploadIcon sx={{ fontSize: 20, color: 'primary.light', opacity: 0.8, mr: 1 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>Drop PDF or click to upload</Typography>
        </Paper>

        <Box sx={{ mx: 2, mb: 1 }}>
          <Stack direction="row" spacing={1}>
            <TextField size="small" fullWidth placeholder="Paste YouTube URL..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} disabled={youtubeLoading} onKeyDown={(e) => e.key === 'Enter' && handleYouTubeUpload()} slotProps={{ input: { startAdornment: (<InputAdornment position="start"><YouTubeIcon sx={{ fontSize: 18, color: '#FF4444' }} /></InputAdornment>) } }} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(17, 24, 39, 0.5)', borderRadius: 2, fontSize: '0.8rem', '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' }, '&:hover fieldset': { borderColor: 'rgba(255, 68, 68, 0.3)' }, '&.Mui-focused fieldset': { borderColor: '#FF4444', borderWidth: '1px' } } }} />
            <IconButton size="small" onClick={handleYouTubeUpload} disabled={!youtubeUrl.trim() || youtubeLoading} sx={{ bgcolor: youtubeUrl.trim() ? 'rgba(255, 68, 68, 0.15)' : 'transparent', color: youtubeUrl.trim() ? '#FF4444' : 'text.secondary', border: '1px solid', borderColor: youtubeUrl.trim() ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255,255,255,0.08)', borderRadius: 2, width: 38, height: 38, '&:hover': { bgcolor: 'rgba(255, 68, 68, 0.25)' } }}>
              {youtubeLoading ? <CircularProgress size={16} sx={{ color: '#FF4444' }} /> : <LinkIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Stack>
        </Box>

        {filteredItems.length > 0 && (
          <List sx={{ flex: 1, overflow: 'auto', px: 1, py: 0.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(124,77,255,0.2)', borderRadius: 2 } }}>
            {filteredItems.map(item => (
              <ListItem key={item.id} disablePadding secondaryAction={<IconButton edge="end" size="small" onClick={() => handleRemoveItem(item.id)} sx={{ color: 'text.secondary', opacity: 0.5, '&:hover': { color: '#FF5252', opacity: 1 } }}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton>} sx={{ mb: 0.5 }}>
                <ListItemButton selected={activeItemId === item.id} onClick={() => { handleSelectItem(item); setMobileOpen(false); }} sx={{ borderRadius: 2, py: 1.2, px: 2, '&.Mui-selected': { bgcolor: 'rgba(124, 77, 255, 0.1)', border: '1px solid rgba(124, 77, 255, 0.2)', '&:hover': { bgcolor: 'rgba(124, 77, 255, 0.15)' } }, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }, transition: 'all 0.2s ease' }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.type === 'youtube' ? <YouTubeIcon sx={{ fontSize: 20, color: '#FF4444' }} /> : <PictureAsPdfIcon sx={{ fontSize: 20, color: item.status === 'ready' ? '#4ADE80' : '#FFB74D' }} />}</ListItemIcon>
                  <ListItemText primary={item.name} secondary={<Typography variant="caption" sx={{ color: item.status === 'ready' ? '#4ADE80' : '#FFB74D', fontSize: '0.7rem' }}>{item.status === 'ready' ? (item.type === 'youtube' ? 'Ready' : formatFileSize(item.size)) : 'Processing...'}</Typography>} primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: activeItemId === item.id ? 600 : 400, noWrap: true }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  )

  // ─── Render ─────────────────────────────────────────
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* ─── Top Navigation ─── */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'rgba(10, 14, 26, 0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 0.5, minHeight: '60px !important' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Button
              onClick={() => setMobileOpen(true)}
              startIcon={<CloudUploadIcon />}
              size="small"
              sx={{
                display: { md: 'none' },
                color: '#fff',
                bgcolor: 'rgba(124, 77, 255, 0.8)',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 1.5,
                py: 0.5,
                border: '1px solid rgba(124, 77, 255, 0.5)',
                '&:hover': { bgcolor: 'rgba(124, 77, 255, 1)' }
              }}
            >
              Upload PDF
            </Button>
            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, background: 'linear-gradient(135deg, #7C4DFF, #00E5FF)', display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'center' }}>
              <DescriptionIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', display: { xs: 'none', sm: 'block' } }}>AI Study Hub</Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>Workspace</InputLabel>
              <Select
                value={activeWorkspace} label="Workspace"
                onChange={(e) => setActiveWorkspace(e.target.value)}
                sx={{ fontSize: '0.82rem', color: '#B388FF', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124,77,255,0.3)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(124,77,255,0.5)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7C4DFF' }, '& .MuiSvgIcon-root': { color: '#B388FF' } }}
              >
                {workspaces.map(ws => (
                  <MenuItem key={ws} value={ws}>
                    <Stack direction="row" alignItems="center" spacing={1}><FolderIcon sx={{ fontSize: 16, color: '#B388FF' }} /><span>{ws}</span></Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Create Workspace">
              <IconButton size="small" onClick={() => setShowNewWorkspaceDialog(true)} sx={{ color: '#B388FF', bgcolor: 'rgba(124,77,255,0.1)', '&:hover': { bgcolor: 'rgba(124,77,255,0.2)' } }}>
                <CreateNewFolderIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }}>
            {!isPro ? (
              <Button variant="outlined" size="small" startIcon={<WorkspacePremiumIcon />} onClick={() => setShowPricingModal(true)} sx={{ display: { xs: 'none', sm: 'flex' }, borderColor: '#FFB74D', color: '#FFB74D', '&:hover': { borderColor: '#FF9800', bgcolor: 'rgba(255, 183, 77, 0.1)' } }}>
                Upgrade
              </Button>
            ) : (
              <Chip icon={<WorkspacePremiumIcon sx={{ fontSize: 14 }} />} label="PRO" size="small" sx={{ bgcolor: 'rgba(255, 183, 77, 0.15)', color: '#FFB74D', border: '1px solid rgba(255, 183, 77, 0.3)', fontWeight: 700, display: { xs: 'none', sm: 'flex' }, '& .MuiChip-icon': { color: '#FFB74D' } }} />
            )}
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>{user?.firstName || 'User'}</Typography>
            <UserButton appearance={{ elements: { avatarBox: { width: 34, height: 34 } } }} />
            <Tooltip title="Sign Out">
              <IconButton onClick={() => signOut()} sx={{ color: '#FF5252', ml: { xs: 0.5, sm: 1 }, bgcolor: 'rgba(255, 82, 82, 0.1)', width: { xs: 38, sm: 34 }, height: { xs: 38, sm: 34 }, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.2)' } }}>
                <LogoutIcon sx={{ fontSize: { xs: 22, sm: 18 } }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* ─── Main Content — Split Panel ─── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

        {/* Mobile Drawer (xs & sm) */}
        {<Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { bgcolor: '#0A0E1A', backgroundImage: 'none' } }}>
          {leftPanelContent}
        </Drawer>}

        {/* Desktop Sidebar (md+) */}
        {<Box sx={{ display: { xs: 'none', md: 'block' }, height: '100%' }}>
          {!viewerPdfUrl && leftPanelContent}
        </Box>}

        {/* Optional: Render PDF Viewer in left panel when active */}
        {viewerPdfUrl && (
          <Box sx={{ width: { xs: '100%', md: '50%' }, height: '100%', borderRight: '1px solid rgba(255,255,255,0.06)', bgcolor: '#000' }}>
            <PdfViewer fileUrl={viewerPdfUrl} fileName={viewerPdfName} highlightPage={viewerHighlightPage} onClose={() => setViewerPdfUrl(null)} />
          </Box>
        )}

        {/* ==================== RIGHT PANEL ==================== */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <Box sx={{ px: { xs: 1.5, sm: 3 }, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', bgcolor: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small" sx={{ '& .MuiToggleButton-root': { color: 'text.secondary', border: '1px solid rgba(255,255,255,0.08)', textTransform: 'none', fontSize: { xs: '0.85rem', sm: '0.78rem' }, px: { xs: 2.5, sm: 2 }, py: { xs: 1, sm: 0.5 }, '&.Mui-selected': { color: '#B388FF', bgcolor: 'rgba(124,77,255,0.12)', borderColor: 'rgba(124,77,255,0.3)', '&:hover': { bgcolor: 'rgba(124,77,255,0.18)' } }, '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } } }}>
              <ToggleButton value="chat">
                <ChatIcon sx={{ fontSize: { xs: 22, sm: 16 } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Chat</Box>
              </ToggleButton>
              <ToggleButton value="quiz" onClick={() => !isPro && setShowPricingModal(true)}>
                <QuizIcon sx={{ fontSize: { xs: 22, sm: 16 } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Quiz</Box>
              </ToggleButton>
              <ToggleButton value="mindmap">
                <AccountTreeIcon sx={{ fontSize: { xs: 22, sm: 16 } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Mind Map</Box>
              </ToggleButton>
            </ToggleButtonGroup>
            <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 1 }}>
              {viewMode === 'chat' && messages.length > 0 && (
                <Button onClick={() => setMessages([])} startIcon={<DeleteOutlineIcon sx={{ fontSize: { xs: 22, sm: 16 } }} />} sx={{ color: '#FF5252', bgcolor: 'rgba(255, 82, 82, 0.1)', fontSize: { xs: '0.85rem', sm: '0.78rem' }, fontWeight: 600, textTransform: 'none', px: { xs: 2, sm: 1.5 }, py: { xs: 0.6, sm: 0.5 }, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.2)' }, '& .MuiButton-startIcon': { margin: { xs: '-1px 6px -1px -2px', sm: '-2px 8px -2px -4px' } } }}>
                  Clear
                </Button>
              )}
            </Stack>
          </Box>

          {viewMode === 'quiz' && <QuizPanel workspace={activeWorkspace} onClose={() => setViewMode('chat')} />}
          {viewMode === 'mindmap' && <MindMapView workspace={activeWorkspace} onClose={() => setViewMode('chat')} />}

          {viewMode === 'chat' && (
            <>
              <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, md: 3 }, py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {messages.map((msg) => (
                  <Fade in key={msg.id}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                      <Avatar sx={{ width: 32, height: 32, mt: 0.5, bgcolor: msg.role === 'assistant' ? 'rgba(124, 77, 255, 0.2)' : 'rgba(0, 229, 255, 0.15)', border: msg.role === 'assistant' ? '1px solid rgba(124, 77, 255, 0.3)' : '1px solid rgba(0, 229, 255, 0.25)' }}>
                        {msg.role === 'assistant' ? <SmartToyIcon sx={{ fontSize: 18, color: '#B388FF' }} /> : <PersonIcon sx={{ fontSize: 18, color: '#18FFFF' }} />}
                      </Avatar>
                      <Box>
                        <Paper elevation={0} sx={{ px: 2.5, py: 2, borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', bgcolor: msg.role === 'user' ? 'rgba(0, 229, 255, 0.08)' : 'rgba(17, 24, 39, 0.7)', border: '1px solid', borderColor: msg.role === 'user' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.06)' }}>
                          <Typography variant="body2" sx={{ lineHeight: 1.75, whiteSpace: 'pre-line', color: 'text.primary' }}>
                            {renderContent(msg.content)}
                          </Typography>

                          {/* Citations block */}
                          {msg.sources && msg.sources.length > 0 && (
                            <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1, fontWeight: 600 }}>Sources:</Typography>
                              <Stack direction="row" flexWrap="wrap" gap={1}>
                                {msg.sources.map((src, idx) => (
                                  <Chip
                                    key={idx}
                                    icon={src.sourceType === 'youtube' ? <YouTubeIcon sx={{ fontSize: 14 }} /> : <MenuBookIcon sx={{ fontSize: 14 }} />}
                                    label={`${src.source} ${src.pageNumber ? `(Pg ${src.pageNumber})` : ''}`}
                                    onClick={() => openCitation(src)}
                                    size="small"
                                    sx={{
                                      bgcolor: 'rgba(255,255,255,0.05)', color: 'primary.light',
                                      border: '1px solid rgba(124,77,255,0.2)', fontSize: '0.7rem',
                                      '&:hover': { bgcolor: 'rgba(124,77,255,0.1)' },
                                      '& .MuiChip-icon': { color: 'primary.light' }
                                    }}
                                  />
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </Paper>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: msg.role === 'user' ? 'right' : 'left', opacity: 0.6, fontSize: '0.68rem', px: 1 }}>
                          {formatTime(msg.timestamp)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Fade>
                ))}
                <div ref={chatEndRef} />
              </Box>

              <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderTop: '1px solid rgba(255,255,255,0.06)', bgcolor: 'rgba(10, 14, 26, 0.6)', backdropFilter: 'blur(10px)' }}>
                <TextField inputRef={chatInputRef} fullWidth placeholder={items.length > 0 ? `Ask about "${activeWorkspace}" workspace...` : 'Upload a PDF or YouTube link to start...'} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} disabled={items.length === 0 || isTyping} multiline maxRows={3} variant="outlined" slotProps={{ input: { endAdornment: (<InputAdornment position="end"><IconButton onClick={handleSend} disabled={!inputValue.trim() || items.length === 0 || isTyping} sx={{ bgcolor: inputValue.trim() && items.length > 0 ? 'primary.main' : 'transparent', color: inputValue.trim() && items.length > 0 ? '#fff' : 'text.secondary', width: { xs: 44, sm: 36 }, height: { xs: 44, sm: 36 }, '&:hover': { bgcolor: inputValue.trim() && items.length > 0 ? 'primary.dark' : 'rgba(255,255,255,0.05)' } }}><SendIcon sx={{ fontSize: { xs: 22, sm: 18 } }} /></IconButton></InputAdornment>) } }} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(17, 24, 39, 0.6)', borderRadius: 3, fontSize: '0.92rem', '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' }, '&:hover fieldset': { borderColor: 'rgba(124, 77, 255, 0.3)' }, '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '1px' } } }} />
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* ─── Dialogs ─── */}
      <Dialog open={showNewWorkspaceDialog} onClose={() => setShowNewWorkspaceDialog(false)} PaperProps={{ sx: { bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', minWidth: 360 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Create New Workspace</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Workspace Name" placeholder="e.g. Biology 101, History, Math..." value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddWorkspace()} sx={{ mt: 1, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowNewWorkspaceDialog(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddWorkspace} disabled={!newWorkspaceName.trim()}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showPricingModal} onClose={() => setShowPricingModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: 'background.paper', borderRadius: 4, border: '1px solid rgba(124,77,255,0.3)', backgroundImage: 'linear-gradient(to bottom, rgba(124,77,255,0.05), transparent)' } }}>
        <Box sx={{ textAlign: 'center', pt: 4, pb: 1 }}>
          <WorkspacePremiumIcon sx={{ fontSize: 48, color: '#FFB74D', mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Upgrade to Premium</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Unlock the full power of the AI Study Hub</Typography>
        </Box>
        <DialogContent sx={{ px: 4 }}>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {['Unlimited PDF Uploads', 'Process YouTube Videos 📺', 'AI Quiz Generator 🔥', 'Priority Customer Support'].map(text => (
              <Stack key={text} direction="row" alignItems="center" spacing={1.5}>
                <CheckCircleOutlineIcon sx={{ color: '#4ADE80', fontSize: 20 }} />
                <Typography variant="body1">{text}</Typography>
              </Stack>
            ))}
          </Stack>
          <Box sx={{ mt: 4, textAlign: 'center', p: 3, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.light' }}>$9.99<Typography component="span" variant="h6" color="text.secondary">/mo</Typography></Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, justifyContent: 'center' }}>
          <Button variant="text" onClick={() => setShowPricingModal(false)} sx={{ color: 'text.secondary', mr: 2 }}>Cancel</Button>
          <Button variant="contained" color="secondary" size="large" onClick={async () => {
            try {
              const res = await fetch(`${API_BASE}/create-checkout-session`, { method: 'POST' });
              const data = await res.json();
              if (data.url) window.location.href = data.url;
            } catch (e) {
              console.error('Checkout error:', e);
            }
          }} sx={{ px: 4, fontWeight: 700 }}>
            Upgrade to Premium
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
