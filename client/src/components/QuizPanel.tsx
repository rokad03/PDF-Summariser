import { useState } from 'react'
import {
  Box, Typography, Paper, Button, Stack, Chip, LinearProgress,
  IconButton, Fade, CircularProgress, Radio, RadioGroup,
  FormControlLabel, FormControl, Collapse,
} from '@mui/material'
import QuizIcon from '@mui/icons-material/Quiz'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ReplayIcon from '@mui/icons-material/Replay'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import SchoolIcon from '@mui/icons-material/School'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface QuizQuestion {
  id: number
  question: string
  options: { A: string; B: string; C: string; D: string }
  correctAnswer: string
  explanation: string
}

interface QuizPanelProps {
  workspace: string
  onClose: () => void
}

export default function QuizPanel({ workspace, onClose }: QuizPanelProps) {
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)
  const [aiExplanation, setAiExplanation] = useState('')
  const [explanationLoading, setExplanationLoading] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  const generateQuiz = async () => {
    setLoading(true)
    setQuiz([])
    setCurrentIndex(0)
    setScore(0)
    setQuizComplete(false)
    try {
      const res = await fetch(`${API_BASE}/quiz/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace, numQuestions: 10, difficulty }),
      })
      if (!res.ok) throw new Error('Failed to generate quiz')
      const data = await res.json()
      setQuiz(data.quiz)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = () => {
    if (!selectedAnswer) return
    setIsAnswered(true)
    if (selectedAnswer === currentQuestion?.correctAnswer) {
      setScore(prev => prev + 1)
    }
  }

  const handleExplain = async () => {
    if (!currentQuestion) return
    setShowExplanation(true)
    setExplanationLoading(true)
    try {
      const res = await fetch(`${API_BASE}/quiz/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          userAnswer: selectedAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          workspace,
        }),
      })
      const data = await res.json()
      setAiExplanation(data.explanation)
    } catch {
      setAiExplanation('Failed to get explanation. Please try again.')
    } finally {
      setExplanationLoading(false)
    }
  }

  const handleNext = () => {
    if (currentIndex >= quiz.length - 1) {
      setQuizComplete(true)
      return
    }
    setCurrentIndex(prev => prev + 1)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setShowExplanation(false)
    setAiExplanation('')
  }

  const currentQuestion = quiz[currentIndex]
  const progress = quiz.length > 0 ? ((currentIndex + 1) / quiz.length) * 100 : 0
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer

  const getScoreColor = () => {
    const pct = (score / quiz.length) * 100
    if (pct >= 80) return '#4ADE80'
    if (pct >= 60) return '#FFB74D'
    return '#FF5252'
  }

  const getScoreEmoji = () => {
    const pct = (score / quiz.length) * 100
    if (pct >= 90) return '🏆'
    if (pct >= 70) return '🎉'
    if (pct >= 50) return '💪'
    return '📚'
  }

  // ─── Empty / Loading State ───
  if (quiz.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center' }}>
        {loading ? (
          <Fade in>
            <Stack alignItems="center" spacing={3}>
              <CircularProgress size={48} sx={{ color: '#B388FF' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Generating your quiz...</Typography>
              <Typography variant="body2" color="text.secondary">AI is analyzing your documents and creating questions</Typography>
            </Stack>
          </Fade>
        ) : (
          <Fade in>
            <Stack alignItems="center" spacing={3} sx={{ maxWidth: 400 }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(124,77,255,0.15), rgba(0,229,255,0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SchoolIcon sx={{ fontSize: 40, color: '#B388FF' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>Test Your Knowledge</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                Generate an AI-powered quiz from your uploaded documents. Choose your difficulty and challenge yourself!
              </Typography>

              <Stack direction="row" spacing={1}>
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <Chip
                    key={d}
                    label={d.charAt(0).toUpperCase() + d.slice(1)}
                    onClick={() => setDifficulty(d)}
                    sx={{
                      bgcolor: difficulty === d ? 'rgba(124,77,255,0.2)' : 'rgba(255,255,255,0.05)',
                      color: difficulty === d ? '#B388FF' : 'text.secondary',
                      border: `1px solid ${difficulty === d ? 'rgba(124,77,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      fontWeight: difficulty === d ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </Stack>

              <Button
                variant="contained"
                size="large"
                startIcon={<QuizIcon />}
                onClick={generateQuiz}
                sx={{ mt: 1, px: 4 }}
              >
                Generate Quiz
              </Button>
              <Button variant="text" size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
                Back to Chat
              </Button>
            </Stack>
          </Fade>
        )}
      </Box>
    )
  }

  // ─── Quiz Complete ───
  if (quizComplete) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center' }}>
        <Fade in>
          <Stack alignItems="center" spacing={3}>
            <Typography sx={{ fontSize: 64 }}>{getScoreEmoji()}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Quiz Complete!</Typography>
            <Box sx={{
              width: 120, height: 120, borderRadius: '50%',
              border: `4px solid ${getScoreColor()}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: getScoreColor() }}>{score}</Typography>
              <Typography variant="caption" color="text.secondary">/ {quiz.length}</Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              {score === quiz.length ? 'Perfect score! You\'re a genius!' :
                score >= quiz.length * 0.7 ? 'Great job! Keep it up!' :
                  score >= quiz.length * 0.5 ? 'Good effort! Review the material and try again.' :
                    'Keep studying! You\'ll get there.'}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" startIcon={<ReplayIcon />} onClick={generateQuiz}>
                New Quiz
              </Button>
              <Button variant="outlined" onClick={onClose} sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'text.primary' }}>
                Back to Chat
              </Button>
            </Stack>
          </Stack>
        </Fade>
      </Box>
    )
  }

  // ─── Active Quiz ───
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Progress bar */}
      <Box sx={{ px: 3, pt: 2, pb: 1, flexShrink: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Chip
            icon={<QuizIcon sx={{ fontSize: 14 }} />}
            label={`Question ${currentIndex + 1} of ${quiz.length}`}
            size="small"
            sx={{ bgcolor: 'rgba(124,77,255,0.1)', color: '#B388FF', border: '1px solid rgba(124,77,255,0.25)' }}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <EmojiEventsIcon sx={{ fontSize: 16, color: '#FFB74D' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFB74D' }}>
              {score} pts
            </Typography>
          </Stack>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6, borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.05)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #7C4DFF, #00E5FF)',
              borderRadius: 3,
            },
          }}
        />
      </Box>

      {/* Question */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
        <Paper elevation={0} sx={{
          p: 3, mb: 3, borderRadius: 3,
          bgcolor: 'rgba(17, 24, 39, 0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.6, fontSize: '1rem' }}>
            {currentQuestion.question}
          </Typography>
        </Paper>

        {/* Options */}
        <FormControl component="fieldset" sx={{ width: '100%' }}>
          <RadioGroup value={selectedAnswer || ''} onChange={(e) => !isAnswered && setSelectedAnswer(e.target.value)}>
            {Object.entries(currentQuestion.options).map(([key, value]) => {
              const isSelected = selectedAnswer === key
              const isCorrectOption = key === currentQuestion.correctAnswer
              let borderColor = 'rgba(255,255,255,0.08)'
              let bgColor = 'rgba(17, 24, 39, 0.4)'
              let icon = null

              if (isAnswered) {
                if (isCorrectOption) {
                  borderColor = 'rgba(74, 222, 128, 0.5)'
                  bgColor = 'rgba(74, 222, 128, 0.08)'
                  icon = <CheckCircleIcon sx={{ fontSize: 20, color: '#4ADE80' }} />
                } else if (isSelected && !isCorrectOption) {
                  borderColor = 'rgba(255, 82, 82, 0.5)'
                  bgColor = 'rgba(255, 82, 82, 0.08)'
                  icon = <CancelIcon sx={{ fontSize: 20, color: '#FF5252' }} />
                }
              } else if (isSelected) {
                borderColor = 'rgba(124, 77, 255, 0.5)'
                bgColor = 'rgba(124, 77, 255, 0.08)'
              }

              return (
                <Paper
                  key={key}
                  elevation={0}
                  sx={{
                    mb: 1.5, borderRadius: 2,
                    border: `1px solid ${borderColor}`,
                    bgcolor: bgColor,
                    transition: 'all 0.2s ease',
                    cursor: isAnswered ? 'default' : 'pointer',
                    '&:hover': !isAnswered ? {
                      borderColor: 'rgba(124, 77, 255, 0.4)',
                      bgcolor: 'rgba(124, 77, 255, 0.05)',
                    } : {},
                  }}
                  onClick={() => !isAnswered && setSelectedAnswer(key)}
                >
                  <FormControlLabel
                    value={key}
                    disabled={isAnswered}
                    control={<Radio sx={{
                      color: 'rgba(255,255,255,0.3)',
                      '&.Mui-checked': { color: isAnswered ? (isCorrectOption ? '#4ADE80' : '#FF5252') : '#B388FF' },
                    }} />}
                    label={
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                        <Chip label={key} size="small" sx={{
                          minWidth: 28, height: 24,
                          bgcolor: 'rgba(255,255,255,0.05)',
                          color: 'text.secondary',
                          fontSize: '0.72rem', fontWeight: 700,
                        }} />
                        <Typography variant="body2" sx={{ flex: 1, py: 0.5 }}>{value}</Typography>
                        {icon}
                      </Stack>
                    }
                    sx={{ m: 0, px: 1.5, py: 1, width: '100%' }}
                  />
                </Paper>
              )
            })}
          </RadioGroup>
        </FormControl>

        {/* Explanation */}
        <Collapse in={isAnswered}>
          <Paper elevation={0} sx={{
            mt: 2, p: 2.5, borderRadius: 2,
            bgcolor: isCorrect ? 'rgba(74, 222, 128, 0.06)' : 'rgba(255, 82, 82, 0.06)',
            border: `1px solid ${isCorrect ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 82, 82, 0.2)'}`,
          }}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              {isCorrect
                ? <CheckCircleIcon sx={{ color: '#4ADE80', mt: 0.3 }} />
                : <CancelIcon sx={{ color: '#FF5252', mt: 0.3 }} />}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: isCorrect ? '#4ADE80' : '#FF5252' }}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: '0.85rem' }}>
                  {currentQuestion.explanation}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {!isCorrect && !showExplanation && (
            <Button
              variant="text" size="small"
              startIcon={<LightbulbIcon />}
              onClick={handleExplain}
              sx={{ mt: 1, color: '#FFB74D', textTransform: 'none' }}
            >
              Get detailed AI explanation
            </Button>
          )}

          <Collapse in={showExplanation}>
            <Paper elevation={0} sx={{
              mt: 1.5, p: 2.5, borderRadius: 2,
              bgcolor: 'rgba(255, 183, 77, 0.06)',
              border: '1px solid rgba(255, 183, 77, 0.2)',
            }}>
              <Stack direction="row" alignItems="flex-start" spacing={1}>
                <LightbulbIcon sx={{ color: '#FFB74D', mt: 0.3 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#FFB74D' }}>
                    AI Explanation
                  </Typography>
                  {explanationLoading ? (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CircularProgress size={14} sx={{ color: '#FFB74D' }} />
                      <Typography variant="body2" color="text.secondary">Analyzing...</Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, whiteSpace: 'pre-line', fontSize: '0.85rem' }}>
                      {aiExplanation}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Collapse>
        </Collapse>
      </Box>

      {/* Action buttons */}
      <Box sx={{
        px: 3, py: 2,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        bgcolor: 'rgba(10, 14, 26, 0.6)',
        flexShrink: 0,
      }}>
        <Stack direction="row" spacing={2}>
          {!isAnswered ? (
            <Button
              variant="contained" fullWidth
              disabled={!selectedAnswer}
              onClick={handleAnswer}
              sx={{ py: 1.2 }}
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              variant="contained" fullWidth
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
              sx={{ py: 1.2 }}
            >
              {currentIndex >= quiz.length - 1 ? 'See Results' : 'Next Question'}
            </Button>
          )}
          <IconButton onClick={onClose} sx={{ color: 'text.secondary', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
            <ReplayIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  )
}
