import { useState } from 'react'
import Home from './Home'
import Play from './Play'
import Submit from './Submit'

export default function App() {
  const [view, setView] = useState('home')

  return (
    <>
      {view === 'home' && <Home onPlay={() => setView('play')} onSubmit={() => setView('submit')} />}
      {view === 'play' && <Play onBack={() => setView('home')} />}
      {view === 'submit' && <Submit onBack={() => setView('home')} />}
    </>
  )
}
