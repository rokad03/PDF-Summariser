import { ThemeProvider, CssBaseline } from '@mui/material'
import { Show } from '@clerk/react'
import theme from './theme'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Show when="signed-out">
        <LandingPage />
      </Show>
      <Show when="signed-in">
        <Dashboard />
      </Show>
    </ThemeProvider>
  )
}

export default App