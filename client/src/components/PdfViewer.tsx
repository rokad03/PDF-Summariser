import { useState, useEffect } from 'react'
import {
  Box, Typography, Stack, IconButton, Paper, CircularProgress,
  Chip, Fade, Tooltip,
} from '@mui/material'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import CloseIcon from '@mui/icons-material/Close'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface PdfViewerProps {
  fileUrl: string
  fileName: string
  highlightPage?: number | null
  onClose: () => void
}

export default function PdfViewer({ fileUrl, fileName, highlightPage, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.2)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (highlightPage && highlightPage > 0 && highlightPage <= numPages) {
      setCurrentPage(highlightPage)
    }
  }, [highlightPage, numPages])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  const goToPrev = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNext = () => setCurrentPage(prev => Math.min(numPages, prev + 1))
  const zoomIn = () => setScale(prev => Math.min(2.5, prev + 0.2))
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2))

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{
        px: 2, py: 1.5,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        bgcolor: 'rgba(255,255,255,0.02)',
        flexShrink: 0,
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
            <MenuBookIcon sx={{ fontSize: 18, color: '#00E5FF' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }} noWrap>
              {fileName}
            </Typography>
            {numPages > 0 && (
              <Chip
                label={`${numPages} pages`}
                size="small"
                sx={{
                  height: 22, fontSize: '0.68rem',
                  bgcolor: 'rgba(0, 229, 255, 0.08)',
                  color: '#00E5FF',
                  border: '1px solid rgba(0, 229, 255, 0.2)',
                }}
              />
            )}
          </Stack>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>

      {/* Toolbar */}
      <Box sx={{
        px: 2, py: 1,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        bgcolor: 'rgba(10,14,26,0.5)',
        flexShrink: 0,
      }}>
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
          <Tooltip title="Previous Page">
            <span>
              <IconButton size="small" onClick={goToPrev} disabled={currentPage <= 1}
                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}>
                <NavigateBeforeIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Chip
            label={`${currentPage} / ${numPages}`}
            size="small"
            sx={{
              bgcolor: 'rgba(124,77,255,0.1)',
              color: '#B388FF',
              border: '1px solid rgba(124,77,255,0.25)',
              fontSize: '0.75rem', fontWeight: 600,
              minWidth: 70, justifyContent: 'center',
            }}
          />

          <Tooltip title="Next Page">
            <span>
              <IconButton size="small" onClick={goToNext} disabled={currentPage >= numPages}
                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}>
                <NavigateNextIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(255,255,255,0.08)', mx: 0.5 }} />

          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={zoomOut}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 40, textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </Typography>
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={zoomIn}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* PDF Content */}
      <Box sx={{
        flex: 1, overflow: 'auto',
        display: 'flex', justifyContent: 'center',
        bgcolor: 'rgba(0,0,0,0.3)',
        p: 2,
      }}>
        {loading && (
          <Fade in>
            <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}>
              <CircularProgress size={32} sx={{ color: '#B388FF' }} />
              <Typography variant="body2" color="text.secondary">Loading PDF...</Typography>
            </Stack>
          </Fade>
        )}
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading=""
        >
          <Paper
            elevation={4}
            sx={{
              borderRadius: 1,
              overflow: 'hidden',
              border: highlightPage === currentPage
                ? '2px solid rgba(124, 77, 255, 0.6)'
                : '1px solid rgba(255,255,255,0.08)',
              transition: 'border-color 0.3s ease',
            }}
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Paper>
        </Document>
      </Box>
    </Box>
  )
}
