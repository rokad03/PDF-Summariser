import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Box, Typography, Button, Paper, Stack, AppBar, Toolbar,
  Chip, IconButton, Fade, TextField, Avatar, Divider, InputAdornment,
  CircularProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Badge, Tooltip,
} from '@mui/material'
import { UserButton, useUser } from '@clerk/react'
import DescriptionIcon from '@mui/icons-material/Description'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import SendIcon from '@mui/icons-material/Send'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ChatIcon from '@mui/icons-material/Chat'
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import AddIcon from '@mui/icons-material/Add'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'

// ─── Types ────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string // ISO string for JSON serialization
}

interface UploadedPdf {
  id: string
  name: string
  size: number
  uploadedAt: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
}

const STORAGE_KEYS = {
  PDFS: 'pdf-summariser-pdfs',
  MESSAGES: 'pdf-summariser-messages',
  ACTIVE_PDF: 'pdf-summariser-active-pdf',
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
  } catch {
    // storage full – silently ignore
  }
}

// ─── API helpers ──────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function uploadPdf(file: File) {
  const formData = new FormData()
  formData.append('pdf', file)
  const res = await fetch(`${API_BASE}/upload/pdf`, { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

async function chatQuery(query: string): Promise<string> {
  const res = await fetch(`${API_BASE}/chat?query=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Chat query failed')
  const data = await res.json()
  return data.answer ?? data.content ?? JSON.stringify(data)
}

// ─── Main Component ───────────────────────────────────
export default function Dashboard() {
  const { user } = useUser()

  // Persisted state
  const [pdfs, setPdfs] = useState<UploadedPdf[]>(() => loadFromStorage(STORAGE_KEYS.PDFS, []))
  const [messages, setMessages] = useState<Message[]>(() => loadFromStorage(STORAGE_KEYS.MESSAGES, []))
  const [activePdfId, setActivePdfId] = useState<string | null>(() => loadFromStorage(STORAGE_KEYS.ACTIVE_PDF, null))

  // Transient state
  const [dragActive, setDragActive] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // ─── Persist to localStorage on changes ─────────────
  useEffect(() => { saveToStorage(STORAGE_KEYS.PDFS, pdfs) }, [pdfs])
  useEffect(() => { saveToStorage(STORAGE_KEYS.MESSAGES, messages) }, [messages])
  useEffect(() => { saveToStorage(STORAGE_KEYS.ACTIVE_PDF, activePdfId) }, [activePdfId])

  // ─── Derived state ──────────────────────────────────
  const activePdf = pdfs.find(p => p.id === activePdfId) ?? null

  // ─── Auto-scroll on new messages ────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ─── Session helpers ────────────────────────────────
  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg])
  }, [])

  // ─── Upload handler ─────────────────────────────────
  const handleUpload = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') return

    const pdfId = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const newPdf: UploadedPdf = {
      id: pdfId,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'uploading',
    }
    setPdfs(prev => [newPdf, ...prev])
    setActivePdfId(pdfId)

    // Add welcome message immediately
    const welcomeMsg: Message = {
      id: `welcome-${pdfId}`,
      role: 'assistant',
      content: `I've received **"${file.name}"** and added it to the knowledge base! You can ask questions about all your uploaded documents.`,
      timestamp: new Date().toISOString(),
    }
    addMessage(welcomeMsg)

    try {
      await uploadPdf(file)
      setPdfs(prev => prev.map(p => p.id === pdfId ? { ...p, status: 'ready' } : p))
      addMessage({
        id: `ready-${pdfId}`,
        role: 'assistant',
        content: `✅ **"${file.name}"** is now processed and ready! Go ahead and ask your questions.`,
        timestamp: new Date().toISOString(),
      })
    } catch {
      setPdfs(prev => prev.map(p => p.id === pdfId ? { ...p, status: 'error' } : p))
      addMessage({
        id: `error-${pdfId}`,
        role: 'assistant',
        content: `❌ Failed to upload **"${file.name}"**. Please try again.`,
        timestamp: new Date().toISOString(),
      })
    }
  }, [addMessage])

  // ─── Drag & Drop ───────────────────────────────────
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) handleUpload(droppedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleUpload(selected)
    e.target.value = '' // reset so same file can be re-uploaded
  }

  // ─── Remove PDF ─────────────────────────────────────
  const handleRemovePdf = (pdfId: string) => {
    setPdfs(prev => prev.filter(p => p.id !== pdfId))
    if (activePdfId === pdfId) {
      const remaining = pdfs.filter(p => p.id !== pdfId)
      setActivePdfId(remaining.length > 0 ? remaining[0].id : null)
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
      const answer = await chatQuery(question)
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: answer,
        timestamp: new Date().toISOString(),
      }
      addMessage(aiMsg)
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

  // ─── Helpers ────────────────────────────────────────
  const formatFileSize = (bytes: number) => {
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

  const statusIcon = (status: UploadedPdf['status']) => {
    switch (status) {
      case 'uploading': return <CircularProgress size={16} sx={{ color: '#FFB74D' }} />
      case 'processing': return <HourglassBottomIcon sx={{ fontSize: 16, color: '#FFB74D', animation: 'spin 2s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
      case 'ready': return <CheckCircleOutlineIcon sx={{ fontSize: 16, color: '#4ADE80' }} />
      case 'error': return <ErrorOutlineIcon sx={{ fontSize: 16, color: '#FF5252' }} />
    }
  }

  const statusColor = (status: UploadedPdf['status']) => {
    switch (status) {
      case 'uploading': case 'processing': return '#FFB74D'
      case 'ready': return '#4ADE80'
      case 'error': return '#FF5252'
    }
  }

  // ─── Render ─────────────────────────────────────────
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* ─── Top Navigation ─── */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'rgba(10, 14, 26, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 0.5, minHeight: '60px !important' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 1.5,
              background: 'linear-gradient(135deg, #7C4DFF, #00E5FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <DescriptionIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
              PDF Summariser
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
              label="AI Powered"
              size="small"
              sx={{
                bgcolor: 'rgba(124, 77, 255, 0.12)',
                color: '#B388FF',
                border: '1px solid rgba(124, 77, 255, 0.25)',
                fontSize: '0.75rem',
                height: 28,
                display: { xs: 'none', sm: 'flex' },
                '& .MuiChip-icon': { color: '#B388FF' },
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
              {user?.firstName || 'User'}
            </Typography>
            <UserButton
              appearance={{
                elements: { avatarBox: { width: 34, height: 34 } },
              }}
            />
          </Stack>
        </Toolbar>
      </AppBar>

      {/* ─── Main Content — Split Panel ─── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>

        {/* ==================== LEFT PANEL — PDFs ==================== */}
        <Box
          sx={{
            width: { xs: '100%', md: '340px' },
            minWidth: { md: 280 },
            maxWidth: { md: 400 },
            height: { md: '100%' },
            maxHeight: { xs: pdfs.length > 0 ? '35vh' : '180px', md: '100%' },
            borderRight: { xs: 'none', md: '1px solid rgba(255,255,255,0.06)' },
            borderBottom: { xs: '1px solid rgba(255,255,255,0.06)', md: 'none' },
            display: { xs: isChatExpanded ? 'none' : 'flex', md: 'flex' },
            flexDirection: 'column',
            bgcolor: 'rgba(10, 14, 26, 0.5)',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* Panel Header */}
          <Box sx={{
            px: 2.5, py: 2,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            bgcolor: 'rgba(255,255,255,0.02)',
          }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <InsertDriveFileIcon sx={{ fontSize: 20, color: 'primary.light' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Documents
                </Typography>
                {pdfs.length > 0 && (
                  <Badge
                    badgeContent={pdfs.length}
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: 'rgba(124, 77, 255, 0.2)',
                        color: '#B388FF',
                        fontSize: '0.7rem',
                        minWidth: 20,
                        height: 20,
                      },
                    }}
                  />
                )}
              </Stack>
              <Tooltip title="Upload PDF">
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    color: 'primary.light',
                    bgcolor: 'rgba(124, 77, 255, 0.1)',
                    '&:hover': { bgcolor: 'rgba(124, 77, 255, 0.2)' },
                  }}
                >
                  <AddIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={handleFileChange}
          />

          {/* Upload Zone + PDF List */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Drop zone (always visible, compact when PDFs exist) */}
            <Paper
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              elevation={0}
              sx={{
                mx: 2, mt: 2, mb: { xs: 1, md: 2 },
                p: pdfs.length === 0 ? { xs: 2, md: 4 } : 1.5,
                display: 'flex',
                flexDirection: { xs: 'row', md: pdfs.length === 0 ? 'column' : 'row' },
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: { xs: 1.5, md: 0 },
                cursor: 'pointer',
                bgcolor: dragActive ? 'rgba(124, 77, 255, 0.08)' : 'rgba(17, 24, 39, 0.5)',
                border: '2px dashed',
                borderColor: dragActive ? 'primary.main' : 'rgba(255,255,255,0.08)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                flexShrink: 0,
                '&:hover': {
                  borderColor: 'rgba(124, 77, 255, 0.4)',
                  bgcolor: 'rgba(124, 77, 255, 0.04)',
                },
              }}
            >
              {pdfs.length === 0 ? (
                <>
                  <Box sx={{
                    width: { xs: 40, md: 64 }, height: { xs: 40, md: 64 }, borderRadius: { xs: 2, md: 3 },
                    mb: { xs: 0, md: 2 },
                    background: 'linear-gradient(135deg, rgba(124,77,255,0.12), rgba(0,229,255,0.08))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <CloudUploadIcon sx={{ fontSize: { xs: 22, md: 32 }, color: 'primary.light', opacity: 0.8 }} />
                  </Box>
                  <Box sx={{ textAlign: { xs: 'left', md: 'center' } }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', md: '1rem' } }}>
                      Drop your PDF here
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      or click to browse
                    </Typography>
                  </Box>
                </>
              ) : (
                <Button
                  variant="text"
                  size="small"
                  startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  sx={{
                    color: 'text.secondary',
                    textTransform: 'none',
                    fontSize: '0.82rem',
                    '&:hover': { color: 'primary.light' },
                  }}
                >
                  Upload another PDF
                </Button>
              )}
            </Paper>

            {/* PDF List */}
            {pdfs.length > 0 && (
              <List sx={{
                flex: 1, overflow: 'auto', px: 1, py: 1,
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(124,77,255,0.2)', borderRadius: 2 },
              }}>
                {pdfs.map(pdf => (
                  <ListItem
                    key={pdf.id}
                    disablePadding
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleRemovePdf(pdf.id)}
                        sx={{
                          color: 'text.secondary',
                          opacity: 0.5,
                          '&:hover': { color: '#FF5252', opacity: 1, bgcolor: 'rgba(255,82,82,0.08)' },
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    }
                    sx={{ mb: 0.5 }}
                  >
                    <ListItemButton
                      selected={activePdfId === pdf.id}
                      onClick={() => setActivePdfId(pdf.id)}
                      sx={{
                        borderRadius: 2,
                        py: 1.5, px: 2,
                        '&.Mui-selected': {
                          bgcolor: 'rgba(124, 77, 255, 0.1)',
                          border: '1px solid rgba(124, 77, 255, 0.2)',
                          '&:hover': { bgcolor: 'rgba(124, 77, 255, 0.15)' },
                        },
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <PictureAsPdfIcon sx={{ fontSize: 20, color: statusColor(pdf.status) }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={pdf.name}
                        secondary={
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
                            {statusIcon(pdf.status)}
                            <Typography variant="caption" sx={{ color: statusColor(pdf.status), fontSize: '0.7rem' }}>
                              {pdf.status === 'uploading' ? 'Uploading...' :
                                pdf.status === 'processing' ? 'Processing...' :
                                  pdf.status === 'ready' ? formatFileSize(pdf.size) :
                                    'Error'}
                            </Typography>
                          </Stack>
                        }
                        primaryTypographyProps={{
                          fontSize: '0.82rem',
                          fontWeight: activePdfId === pdf.id ? 600 : 400,
                          noWrap: true,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}

            {/* Quick Questions */}
            {pdfs.length > 0 && (
              <Fade in>
                <Box sx={{ px: 2, pb: 2, display: { xs: 'none', md: 'block' } }}>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1.5 }} />
                  <Typography variant="caption" color="text.secondary" sx={{
                    mb: 1, display: 'block', fontWeight: 500,
                    textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem',
                  }}>
                    Quick Questions
                  </Typography>
                  <Stack spacing={0.5}>
                    {[
                      'Summarise this document',
                      'What are the key points?',
                      'What are the conclusions?',
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="text"
                        size="small"
                        onClick={() => {
                          setInputValue(suggestion)
                          chatInputRef.current?.focus()
                        }}
                        sx={{
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          color: 'text.secondary',
                          fontWeight: 400,
                          fontSize: '0.78rem',
                          px: 1.5, py: 0.75,
                          borderRadius: 1.5,
                          bgcolor: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.04)',
                          textTransform: 'none',
                          transition: 'all 0.2s ease',
                          minHeight: 0,
                          '&:hover': {
                            bgcolor: 'rgba(124, 77, 255, 0.08)',
                            borderColor: 'rgba(124, 77, 255, 0.25)',
                            color: 'primary.light',
                          },
                        }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </Stack>
                </Box>
              </Fade>
            )}
          </Box>
        </Box>

        {/* ==================== RIGHT PANEL — Chat ==================== */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {/* Chat Header */}
          <Box sx={{
            px: 3, py: 2,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            bgcolor: 'rgba(255,255,255,0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
              <ChatIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                AI Powered Chat
              </Typography>
              {activePdf ? (
                <Chip
                  label={activePdf.name}
                  size="small"
                  icon={<PictureAsPdfIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    ml: 1,
                    maxWidth: 300,
                    bgcolor: 'rgba(124, 77, 255, 0.08)',
                    color: 'primary.light',
                    border: '1px solid rgba(124, 77, 255, 0.2)',
                    fontSize: '0.72rem',
                    '& .MuiChip-icon': { color: 'primary.light' },
                    '& .MuiChip-label': {
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    },
                  }}
                />
              ) : (
                <Chip
                  label="All Documents"
                  size="small"
                  icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    ml: 1,
                    maxWidth: 300,
                    bgcolor: 'rgba(0, 229, 255, 0.08)',
                    color: '#00E5FF',
                    border: '1px solid rgba(0, 229, 255, 0.2)',
                    fontSize: '0.72rem',
                    '& .MuiChip-icon': { color: '#00E5FF' },
                  }}
                />
              )}
            </Stack>
            <IconButton 
              size="small"
              onClick={() => setIsChatExpanded(!isChatExpanded)}
              sx={{ 
                display: { xs: 'inline-flex', md: 'none' }, 
                color: 'text.secondary',
                ml: 1,
                bgcolor: 'rgba(255,255,255,0.03)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
              }}
            >
              {isChatExpanded ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Box>

          {/* Chat Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: { xs: 2, md: 3 },
              py: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
            }}
          >
            {/* Empty state — no messages */}
            {messages.length === 0 && (
              <Box sx={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              }}>
                {/* User profile photo */}
                <Avatar
                  src={user?.imageUrl}
                  alt={user?.firstName || 'User'}
                  sx={{
                    width: 88, height: 88, mb: 2.5,
                    border: '3px solid rgba(124, 77, 255, 0.3)',
                    boxShadow: '0 0 30px rgba(124, 77, 255, 0.15), 0 0 60px rgba(0, 229, 255, 0.08)',
                  }}
                />
                {/* Welcome message */}
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700, mb: 1,
                    background: 'linear-gradient(135deg, #B388FF, #18FFFF)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Welcome, {user?.firstName || 'User'}!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 3, lineHeight: 1.7 }}>
                  Upload a PDF on the left panel, then ask me anything about it — summaries, key points, specific questions, and more.
                </Typography>
                <Chip
                  icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                  label="Powered by Nishit's AI"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(124, 77, 255, 0.08)',
                    color: '#B388FF',
                    border: '1px solid rgba(124, 77, 255, 0.2)',
                    fontSize: '0.75rem',
                    '& .MuiChip-icon': { color: '#B388FF' },
                  }}
                />
              </Box>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <Fade in key={msg.id}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                  sx={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32, height: 32, mt: 0.5,
                      bgcolor: msg.role === 'assistant'
                        ? 'rgba(124, 77, 255, 0.2)'
                        : 'rgba(0, 229, 255, 0.15)',
                      border: msg.role === 'assistant'
                        ? '1px solid rgba(124, 77, 255, 0.3)'
                        : '1px solid rgba(0, 229, 255, 0.25)',
                    }}
                  >
                    {msg.role === 'assistant'
                      ? <SmartToyIcon sx={{ fontSize: 18, color: '#B388FF' }} />
                      : <PersonIcon sx={{ fontSize: 18, color: '#18FFFF' }} />
                    }
                  </Avatar>
                  <Box>
                    <Paper
                      elevation={0}
                      sx={{
                        px: 2.5, py: 2,
                        borderRadius: msg.role === 'user'
                          ? '16px 16px 4px 16px'
                          : '16px 16px 16px 4px',
                        bgcolor: msg.role === 'user'
                          ? 'rgba(0, 229, 255, 0.08)'
                          : 'rgba(17, 24, 39, 0.7)',
                        border: '1px solid',
                        borderColor: msg.role === 'user'
                          ? 'rgba(0, 229, 255, 0.15)'
                          : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          lineHeight: 1.75,
                          whiteSpace: 'pre-line',
                          color: 'text.primary',
                        }}
                      >
                        {renderContent(msg.content)}
                      </Typography>
                    </Paper>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        mt: 0.5, display: 'block',
                        textAlign: msg.role === 'user' ? 'right' : 'left',
                        opacity: 0.6, fontSize: '0.68rem',
                        px: 1,
                      }}
                    >
                      {formatTime(msg.timestamp)}
                    </Typography>
                  </Box>
                </Stack>
              </Fade>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <Fade in>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{
                    width: 32, height: 32,
                    bgcolor: 'rgba(124, 77, 255, 0.2)',
                    border: '1px solid rgba(124, 77, 255, 0.3)',
                  }}>
                    <SmartToyIcon sx={{ fontSize: 18, color: '#B388FF' }} />
                  </Avatar>
                  <Paper
                    elevation={0}
                    sx={{
                      px: 2.5, py: 1.5,
                      borderRadius: '16px 16px 16px 4px',
                      bgcolor: 'rgba(17, 24, 39, 0.7)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', gap: 1,
                    }}
                  >
                    <CircularProgress size={14} sx={{ color: 'primary.light' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                      Analysing document...
                    </Typography>
                  </Paper>
                </Stack>
              </Fade>
            )}

            <div ref={chatEndRef} />
          </Box>

          {/* Chat Input */}
          <Box sx={{
            px: { xs: 2, md: 3 }, py: 2,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            bgcolor: 'rgba(10, 14, 26, 0.6)',
            backdropFilter: 'blur(10px)',
          }}>
            <TextField
              inputRef={chatInputRef}
              fullWidth
              placeholder={pdfs.length > 0 ? 'Ask anything about your stored documents...' : 'Upload a PDF first to start chatting...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={pdfs.length === 0 || isTyping}
              multiline
              maxRows={3}
              variant="outlined"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleSend}
                        disabled={!inputValue.trim() || pdfs.length === 0 || isTyping}
                        sx={{
                          bgcolor: inputValue.trim() && pdfs.length > 0
                            ? 'primary.main'
                            : 'transparent',
                          color: inputValue.trim() && pdfs.length > 0
                            ? '#fff'
                            : 'text.secondary',
                          width: 36, height: 36,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: inputValue.trim() && pdfs.length > 0
                              ? 'primary.dark'
                              : 'rgba(255,255,255,0.05)',
                          },
                          '&.Mui-disabled': {
                            color: 'rgba(255,255,255,0.15)',
                          },
                        }}
                      >
                        <SendIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(17, 24, 39, 0.6)',
                  borderRadius: 3,
                  fontSize: '0.92rem',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.08)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(124, 77, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: '1px',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(17, 24, 39, 0.3)',
                  },
                },
                '& .MuiInputBase-input': {
                  py: 1.5,
                },
                '& .MuiInputBase-input::placeholder': {
                  opacity: 0.5,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center', opacity: 0.5, fontSize: '0.68rem' }}>
              Press Enter to send • Shift+Enter for new line
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ─── Footer ─── */}
      <Box
        component="footer"
        sx={{
          py: 1.5,
          px: 3,
          textAlign: 'center',
          bgcolor: 'rgba(10, 14, 26, 0.95)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          flexShrink: 0,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'text.secondary',
            fontSize: '0.72rem',
            letterSpacing: '0.03em',
          }}
        >
          Made with
          <FavoriteIcon
            sx={{
              fontSize: 13,
              color: '#FF4081',
              animation: 'heartbeat 1.5s ease-in-out infinite',
              '@keyframes heartbeat': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.2)' },
              },
            }}
          />
          by
          <Box
            component="span"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #B388FF, #18FFFF)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Nishit
          </Box>
        </Typography>
      </Box>
    </Box>
  )
}
