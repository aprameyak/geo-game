import { useState, useEffect } from 'react'
import './Home.css'

export default function Home({ onPlay, onSubmit }) {
  const [photoCount, setPhotoCount] = useState(null)

  useEffect(() => {
    fetch('/api/photos')
      .then(r => r.json())
      .then(data => setPhotoCount(Array.isArray(data) ? data.length : null))
      .catch(() => {})
  }, [])

  return (
    <div className="home">
      <header className="home-header">
        <div className="logo">
          <span className="logo-icon">📍</span>
          <h1>PhotoGuessr</h1>
        </div>
        <p className="tagline">Guess where the photo was taken — or add your own.</p>
        {photoCount != null && (
          <p className="photo-count">
            {photoCount === 0
              ? 'No photos yet — be the first to submit one!'
              : `${photoCount} photo${photoCount === 1 ? '' : 's'} in the pool`}
          </p>
        )}
      </header>

      <nav className="home-nav">
        <button className="card card-play" onClick={onPlay} disabled={photoCount === 0}>
          <span className="card-icon">🎯</span>
          <h2>Play</h2>
          <p>5 rounds — guess where each photo was taken and earn up to 5,000 points per round.</p>
          {photoCount === 0 && <span className="card-badge">No photos yet</span>}
        </button>
        <button className="card card-submit" onClick={onSubmit}>
          <span className="card-icon">📤</span>
          <h2>Submit a photo</h2>
          <p>Upload a photo and pin its location on the map for others to guess.</p>
        </button>
      </nav>

      <footer className="home-footer">
        <p>Like GeoGuessr, but with photos you and others upload.</p>
      </footer>
    </div>
  )
}
