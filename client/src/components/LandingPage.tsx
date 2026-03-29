import { useState, useEffect } from 'react'
import { Box, Container, Typography, Button, Grid, Card, CardContent, Stack, AppBar, Toolbar, Chip, IconButton, Menu } from '@mui/material'
import { SignInButton, SignUpButton } from '@clerk/react'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import MenuIcon from '@mui/icons-material/Menu'
import BoltIcon from '@mui/icons-material/Bolt'
import DescriptionIcon from '@mui/icons-material/Description'
import SecurityIcon from '@mui/icons-material/Security'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import YouTubeIcon from '@mui/icons-material/YouTube'
import QuizIcon from '@mui/icons-material/Quiz'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import FolderIcon from '@mui/icons-material/Folder'
import SmartToyIcon from '@mui/icons-material/SmartToy'

const ANIMATED_WORDS = [
  "AI Study Hub",
  "YouTube Integrator",
  "Mind Map Creator",
  "Quiz Generator",
];

const features = [
  {
    icon: <YouTubeIcon sx={{ fontSize: 32 }} />,
    title: 'YouTube Integration',
    description: 'Paste any YouTube lecture video link and instantly chat with its transcript. Turn 2-hour lectures into instant answers.',
  },
  {
    icon: <QuizIcon sx={{ fontSize: 32 }} />,
    title: 'AI Flashcards & Quizzes',
    description: 'Test your knowledge instantly. Generate intelligent multiple-choice quizzes base on your uploaded materials.',
  },
  {
    icon: <AccountTreeIcon sx={{ fontSize: 32 }} />,
    title: 'Mind Map Visualizer',
    description: 'Visualize complex concepts effortlessly. AI generates interactive Mind Maps to help you understand relationships.',
  },
  {
    icon: <BoltIcon sx={{ fontSize: 32 }} />,
    title: 'Instant Citations',
    description: 'Every answer links directly to the source document and page number, so you can always verify facts.',
  },
  {
    icon: <DescriptionIcon sx={{ fontSize: 32 }} />,
    title: 'Subject Workspaces',
    description: 'Organize your study materials neatly into isolated workspaces for different subjects or projects.',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 32 }} />,
    title: 'Secure & Private',
    description: 'Your documents and data are securely processed and isolated in high-performance cloud infrastructure.',
  },
]

const stats = [
  { value: '25K+', label: 'Documents Processed' },
  { value: '1M+', label: 'Quizzes Auto-Generated' },
  { value: 'Zero', label: 'Boring Lectures' },
  { value: '10x', label: 'Faster Study Time' },
]

export default function LandingPage() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const current = loopNum % ANIMATED_WORDS.length;
    const fullText = ANIMATED_WORDS[current];

    const handleType = () => {
      setText(
        isDeleting
          ? fullText.substring(0, text.length - 1)
          : fullText.substring(0, text.length + 1)
      );

      let nextSpeed = isDeleting ? 40 : 80;

      if (!isDeleting && text === fullText) {
        nextSpeed = 1500;
        setIsDeleting(true);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        nextSpeed = 300;
      }
      setTypingSpeed(nextSpeed);
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed]);

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
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em', fontSize: { xs: '1.2rem', sm: '1.25rem' } }}>
                AI Study Hub
              </Typography>
            </Stack>

            {/* Desktop Navigation */}
            <Stack direction="row" spacing={1.5} sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <SignInButton mode="modal">
                <Button variant="text" sx={{ color: 'text.secondary', textTransform: 'none', '&:hover': { color: 'text.primary', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="contained" color="primary" sx={{ textTransform: 'none' }}>
                  Start Learning Free
                </Button>
              </SignUpButton>
            </Stack>

            {/* Mobile Navigation */}
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <IconButton onClick={handleClick} sx={{ color: 'text.secondary' }}>
                <MenuIcon sx={{ fontSize: 28 }} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{ sx: { bgcolor: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 200, mt: 1 } }}
              >
                <Box onClick={handleClose} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2 }}>
                  <SignInButton mode="modal">
                    <Button fullWidth variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'text.primary', textTransform: 'none' }}>Sign In</Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button fullWidth variant="contained" color="primary" sx={{ textTransform: 'none' }}>Start Learning Free</Button>
                  </SignUpButton>
                </Box>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: 6 }}>
        <Box sx={{ textAlign: 'center', pt: { xs: 4, md: 8 }, pb: { xs: 6, md: 10 } }}>
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
            label="Supercharge Your Studies"
            sx={{
              mb: 4,
              bgcolor: 'rgba(124, 77, 255, 0.12)',
              color: '#B388FF',
              border: '1px solid rgba(124, 77, 255, 0.25)',
              fontWeight: 600,
              fontSize: '0.85rem',
              py: 0.5,
              '& .MuiChip-icon': { color: '#B388FF' },
            }}
          />
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '5rem' },
              lineHeight: 1.1,
              mb: 3,
              fontWeight: 800,
              minHeight: { xs: '6rem', sm: '8rem', md: '11.5rem' },
            }}
          >
            <Box component="span" sx={{ color: '#F1F5F9' }}>
              Your Ultimate
            </Box>
            <br />
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #B388FF 0%, #00E5FF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                borderRight: '0.08em solid #00E5FF',
                animation: 'blink .75s step-end infinite',
                paddingRight: '4px',
                display: 'inline-block',
                '@keyframes blink': {
                  'from, to': { borderColor: 'transparent' },
                  '50%': { borderColor: '#00E5FF' },
                },
              }}
            >
              {text}
            </Box>
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: 700,
              mx: 'auto',
              mb: 5,
              fontWeight: 400,
              lineHeight: 1.7,
              fontSize: { xs: '1rem', md: '1.25rem' },
            }}
          >
            Upload PDFs or YouTube videos to instantly get summaries,
            take interactive quizzes, generate mind maps, and ace your exams with AI.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 8 }}>
            <SignUpButton>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{ px: 4, py: 1.5, fontSize: '1rem', fontWeight: 700 }}
              >
                Create Free Account
              </Button>
            </SignUpButton>
            <SignInButton>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  px: 4, py: 1.5, fontSize: '1rem', fontWeight: 600,
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'rgba(124, 77, 255, 0.5)',
                    bgcolor: 'rgba(124, 77, 255, 0.08)',
                  },
                }}
              >
                Sign In
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
          mx: 'auto', maxWidth: 900, mb: 12,
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
          <Box sx={{ display: 'flex', p: 0 }}>
            <Box sx={{ width: '30%', borderRight: '1px solid rgba(255,255,255,0.06)', p: 3, display: { xs: 'none', md: 'block' } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 1 }}>WORKSPACES</Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ color: 'primary.light', fontWeight: 500 }}><FolderIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />Biology 101</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}><FolderIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />History of Rome</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}><FolderIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />Calculus II</Typography>
              </Stack>
            </Box>
            <Box sx={{ flex: 1, p: { xs: 3, md: 5 } }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                <SmartToyIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Cellular Respiration Explaination</Typography>
              </Stack>
              <Box sx={{
                p: 3, borderRadius: 2,
                bgcolor: 'rgba(124, 77, 255, 0.06)',
                border: '1px solid rgba(124, 77, 255, 0.15)',
                mb: 3,
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  <strong style={{ color: '#B388FF' }}>Answer:</strong> Cellular respiration is the process by which cells derive energy from glucose. It occurs in three main stages: Glycolysis, the Krebs cycle, and the Electron transport chain. According to the document, this process yields 36-38 ATP molecules per glucose molecule.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<DescriptionIcon sx={{ fontSize: 14 }} />}
                  label="Biology_Chapter5.pdf (Pg 12)"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(0, 229, 255, 0.08)',
                    color: '#18FFFF',
                    border: '1px solid rgba(0, 229, 255, 0.2)',
                    fontSize: '0.75rem',
                    '& .MuiChip-icon': { color: '#18FFFF' }
                  }}
                />
                <Chip
                  icon={<YouTubeIcon sx={{ fontSize: 14 }} />}
                  label="Lecture 4 Video"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 68, 68, 0.15)',
                    color: '#FF4444',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    fontSize: '0.75rem',
                    '& .MuiChip-icon': { color: '#FF4444' }
                  }}
                />
              </Stack>
            </Box>
          </Box>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: { xs: 6, md: 10 } }}>
          <Typography
            variant="h3"
            align="center"
            sx={{
              mb: 2,
              fontWeight: 800,
              fontSize: { xs: '1.8rem', md: '2.5rem' },
            }}
          >
            How AI Study Hub Gets You A+
          </Typography>
          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            sx={{ mb: 8, maxWidth: 600, mx: 'auto', fontSize: '1.1rem' }}
          >
            A complete ecosystem designed strictly for students and lifelong learners, replacing fragmented applications and giving you a supreme edge.
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
                    border: '1px solid rgba(255,255,255,0.05)',
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
                    <Typography variant="h5" sx={{ mb: 1.5, fontSize: '1.25rem', fontWeight: 700 }}>
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
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 800, fontSize: { xs: '1.6rem', md: '2.5rem' }, position: 'relative' }}>
            Ready to Dominate Your Exams?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 480, mx: 'auto', position: 'relative' }}>
            Join thousands of students who trust AI Study Hub to learn faster, retain more, and save countless hours.
          </Typography>
          <SignUpButton>
            <Button
              variant="contained"
              size="large"
              sx={{ px: 5, py: 1.5, fontSize: '1rem', fontWeight: 700, position: 'relative' }}
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
            © {new Date().getFullYear()} Build with ❤️ for students.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
