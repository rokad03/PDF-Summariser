import { useState, useEffect, useRef } from 'react'
import { Box, Typography, CircularProgress, Stack, Button, Fade } from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import RefreshIcon from '@mui/icons-material/Refresh'
import mermaid from 'mermaid'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface MindMapViewProps {
  workspace: string
  onClose: () => void
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#7C4DFF',
    primaryTextColor: '#F1F5F9',
    primaryBorderColor: '#B388FF',
    lineColor: '#94A3B8',
    secondaryColor: '#1E293B',
    tertiaryColor: '#0A0E1A',
    fontSize: '14px',
  },
})

export default function MindMapView({ workspace, onClose }: MindMapViewProps) {
  const [loading, setLoading] = useState(false)
  const [mermaidCode, setMermaidCode] = useState('')
  const [error, setError] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const generateMindMap = async () => {
    setLoading(true)
    setError('')
    setMermaidCode('')
    try {
      const res = await fetch(`${API_BASE}/mindmap?workspace=${encodeURIComponent(workspace)}`)
      if (!res.ok) throw new Error('Failed to generate mind map')
      const data = await res.json()
      setMermaidCode(data.mermaid)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate mind map')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!mermaidCode || !containerRef.current) return

    const renderMermaid = async () => {
      try {
        containerRef.current!.innerHTML = ''
        const id = `mermaid-${Date.now()}`
        const { svg } = await mermaid.render(id, mermaidCode)
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
          // Make SVG responsive
          const svgEl = containerRef.current.querySelector('svg')
          if (svgEl) {
            svgEl.style.maxWidth = '100%'
            svgEl.style.height = 'auto'
          }
        }
      } catch (err) {
        console.error('Mermaid render error:', err)
        setError('Failed to render mind map. The AI may have generated invalid syntax. Try again!')
      }
    }

    renderMermaid()
  }, [mermaidCode])

  // Auto-generate on mount
  useEffect(() => {
    generateMindMap()
  }, [])

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{
        px: 3, py: 2,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        bgcolor: 'rgba(255,255,255,0.02)',
        flexShrink: 0,
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <AccountTreeIcon sx={{ fontSize: 20, color: '#00E5FF' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Mind Map</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={generateMindMap}
              disabled={loading}
              sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.8rem' }}
            >
              Regenerate
            </Button>
            <Button
              size="small"
              onClick={onClose}
              sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.8rem' }}
            >
              Back
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{
        flex: 1, overflow: 'auto', display: 'flex',
        alignItems: 'center', justifyContent: 'center', p: 3,
      }}>
        {loading ? (
          <Fade in>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress size={40} sx={{ color: '#B388FF' }} />
              <Typography variant="body2" color="text.secondary">Generating mind map from your documents...</Typography>
            </Stack>
          </Fade>
        ) : error ? (
          <Fade in>
            <Stack alignItems="center" spacing={2}>
              <Typography variant="body2" color="error">{error}</Typography>
              <Button variant="outlined" size="small" onClick={generateMindMap} sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'text.primary' }}>
                Try Again
              </Button>
            </Stack>
          </Fade>
        ) : (
          <Fade in>
            <Box
              ref={containerRef}
              sx={{
                width: '100%',
                '& svg': {
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: 2,
                },
              }}
            />
          </Fade>
        )}
      </Box>
    </Box>
  )
}
