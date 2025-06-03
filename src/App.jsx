import { Theme } from '@radix-ui/themes'
import Home from './pages/home'

function App() {
  return (
    <Theme appearance="light" accentColor="blue" radius="medium">
      <Home />
    </Theme>
  )
}

export default App
