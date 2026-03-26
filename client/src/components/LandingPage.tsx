import { Box, Container, Typography, Button, Grid, Card, CardContent, Stack, AppBar, Toolbar, Chip } from '@mui/material'
import { SignInButton, SignUpButton } from '@clerk/react'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import BoltIcon from '@mui/icons-material/Bolt'
import DescriptionIcon from '@mui/icons-material/Description'
import SecurityIcon from '@mui/icons-material/Security'
import SpeedIcon from '@mui/icons-material/Speed'
import SummarizeIcon from '@mui/icons-material/Summarize'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

const features = [
  {
    icon: <BoltIcon sx={{ fontSize: 32 }} />,
    title: 'Lightning Fast',
    description: 'Get comprehensive summaries in seconds, not minutes. Our AI processes documents instantly.',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 32 }} />,
    title: 'Secure & Private',
    description: 'Your documents are encrypted and never stored. Complete privacy guaranteed.',
  },
  {
    icon: <SpeedIcon sx={{ fontSize: 32 }} />,
    title: 'Smart Analysis',
    description: 'AI-powered extraction of key points, themes, and actionable insights from any PDF.',
  },
]

const stats = [
  { value: '10K+', label: 'PDFs Summarised' },
  { value: '99.2%', label: 'Accuracy Rate' },
  { value: '<5s', label: 'Avg. Processing' },
  { value: '500+', label: 'Happy Users' },
]

export default function LandingPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>
      {/* Animated Background Orbs */}
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      }}>
        <Box sx={{
          position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,77,255,0.15) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
            '50%': { transform: 'translate(40px, -30px) scale(1.1)' },
          },
        }} />
        <Box sx={{
          position: 'absolute', bottom: '-10%', right: '-5%', width: 500, height: 500,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.1) 0%, transparent 70%)',
          animation: 'float2 10s ease-in-out infinite',
          '@keyframes float2': {
            '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
            '50%': { transform: 'translate(-30px, 20px) scale(1.05)' },
          },
        }} />
        <Box sx={{
          position: 'absolute', top: '40%', right: '20%', width: 300, height: 300,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,77,255,0.08) 0%, transparent 70%)',
          animation: 'float3 12s ease-in-out infinite',
          '@keyframes float3': {
            '0%, 100%': { transform: 'translate(0, 0)' },
            '33%': { transform: 'translate(20px, -20px)' },
            '66%': { transform: 'translate(-10px, 15px)' },
          },
        }} />
      </Box>

      {/* Navigation */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(10, 14, 26, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          zIndex: 10,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                background: 'linear-gradient(135deg, #7C4DFF, #00E5FF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <DescriptionIcon sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                PDF Summariser
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <SignInButton>
                <Button
                  variant="text"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary', bgcolor: 'rgba(255,255,255,0.05)' },
                  }}
                >
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button variant="contained" color="primary">
                  Get Started Free
                </Button>
              </SignUpButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', pt: { xs: 8, md: 12 }, pb: { xs: 6, md: 10 } }}>
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
            label="Powered by Advanced AI"
            sx={{
              mb: 4,
              bgcolor: 'rgba(124, 77, 255, 0.12)',
              color: '#B388FF',
              border: '1px solid rgba(124, 77, 255, 0.25)',
              fontWeight: 500,
              fontSize: '0.85rem',
              py: 0.5,
              '& .MuiChip-icon': { color: '#B388FF' },
            }}
          />
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              lineHeight: 1.1,
              mb: 3,
              background: 'linear-gradient(135deg, #F1F5F9 0%, #B388FF 50%, #00E5FF 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Summarise Any PDF
            <br />
            In Seconds
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: 600,
              mx: 'auto',
              mb: 5,
              fontWeight: 400,
              lineHeight: 1.7,
              fontSize: { xs: '1rem', md: '1.15rem' },
            }}
          >
            Upload your PDF documents and let our AI extract key insights,
            generate concise summaries, and save you hours of reading time.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 8 }}>
            <SignUpButton>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
              >
                Start Summarising — Free
              </Button>
            </SignUpButton>
            <SignInButton>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  px: 4, py: 1.5, fontSize: '1rem',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'rgba(124, 77, 255, 0.5)',
                    bgcolor: 'rgba(124, 77, 255, 0.08)',
                  },
                }}
              >
                I Have an Account
              </Button>
            </SignInButton>
          </Stack>

          {/* Stats Row */}
          <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
            {stats.map((stat) => (
              <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
                <Box sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(124, 77, 255, 0.06)',
                    borderColor: 'rgba(124, 77, 255, 0.2)',
                    transform: 'translateY(-2px)',
                  },
                }}>
                  <Typography variant="h4" sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #7C4DFF, #00E5FF)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Mockup Card */}
        <Box sx={{
          mx: 'auto', maxWidth: 800, mb: 12,
          borderRadius: 4, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          bgcolor: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 100px rgba(124,77,255,0.08)',
        }}>
          {/* Window Chrome */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            bgcolor: 'rgba(255,255,255,0.02)',
          }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF5F57' }} />
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FEBC2E' }} />
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#28C840' }} />
          </Box>
          {/* Content Preview */}
          <Box sx={{ p: { xs: 3, md: 5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <SummarizeIcon sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Document Summary</Typography>
            </Stack>
            <Box sx={{
              p: 3, borderRadius: 2,
              bgcolor: 'rgba(124, 77, 255, 0.06)',
              border: '1px solid rgba(124, 77, 255, 0.15)',
              mb: 3,
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                <strong style={{ color: '#B388FF' }}>Key Findings:</strong> The document outlines a comprehensive
                analysis of market trends in Q4 2024, highlighting a 23% increase in digital transformation
                investments across enterprise sectors. Three primary themes emerged: AI integration,
                sustainable technology practices, and hybrid workforce enablement...
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {['Market Analysis', 'AI Trends', 'Digital Transformation', 'Q4 2024'].map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(0, 229, 255, 0.08)',
                    color: '#18FFFF',
                    border: '1px solid rgba(0, 229, 255, 0.2)',
                    fontSize: '0.75rem',
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: { xs: 6, md: 10 } }}>
          <Typography
            variant="h3"
            align="center"
            sx={{
              mb: 2,
              fontSize: { xs: '1.8rem', md: '2.5rem' },
            }}
          >
            Why Choose PDF Summariser?
          </Typography>
          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            sx={{ mb: 8, maxWidth: 500, mx: 'auto' }}
          >
            Built for professionals who value their time and need accurate, instant document analysis.
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature) => (
              <Grid size={{ xs: 12, md: 4 }} key={feature.title}>
                <Card
                  sx={{
                    height: '100%',
                    bgcolor: 'rgba(17, 24, 39, 0.6)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'default',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      borderColor: 'rgba(124, 77, 255, 0.3)',
                      boxShadow: '0 20px 40px rgba(124, 77, 255, 0.15)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        width: 56, height: 56, borderRadius: 3, mb: 3,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(124,77,255,0.15), rgba(0,229,255,0.1))',
                        color: 'primary.light',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" sx={{ mb: 1.5, fontSize: '1.25rem' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            py: { xs: 6, md: 8 }, px: { xs: 3, md: 6 }, mb: 8,
            textAlign: 'center', borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(124,77,255,0.12) 0%, rgba(0,229,255,0.08) 100%)',
            border: '1px solid rgba(124, 77, 255, 0.2)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <Box sx={{
            position: 'absolute', top: -80, right: -80, width: 200, height: 200,
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,77,255,0.15), transparent)',
          }} />
          <Typography variant="h3" sx={{ mb: 2, fontSize: { xs: '1.6rem', md: '2.2rem' }, position: 'relative' }}>
            Ready to Save Hours of Reading?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 480, mx: 'auto', position: 'relative' }}>
            Join thousands of professionals who trust PDF Summariser to extract the insights that matter most.
          </Typography>
          <SignUpButton>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{ px: 5, py: 1.5, fontSize: '1rem', position: 'relative' }}
            >
              Get Started — It's Free
            </Button>
          </SignUpButton>
        </Box>

        {/* Footer */}
        <Box sx={{
          py: 4, textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Typography variant="body2" color="text.secondary">
            © 2026 PDF Summariser. Built with ❤️ for productivity.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
