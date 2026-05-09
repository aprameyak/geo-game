import { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, useMapEvents, Marker as ReactLeafletMarker, Polyline } from 'react-leaflet'
import L from 'leaflet'
import './Play.css'

const API = '/api'
const ROUNDS = 5

function GuessMap({ onGuess, disabled }) {
  useMapEvents({
    click(e) {
      if (!disabled) onGuess(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function PinMarker({ position, color, label }) {
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `<span style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.5);display:block;"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
  return <ReactLeafletMarker position={position} icon={icon} title={label} />
}

function ScoreRating({ score, total }) {
  const pct = total > 0 ? score / total : 0
  if (pct >= 0.8) return <span className="rating rating-gold">Geography Expert</span>
  if (pct >= 0.6) return <span className="rating rating-silver">Well Traveled</span>
  if (pct >= 0.35) return <span className="rating rating-bronze">Getting There</span>
  return <span className="rating rating-plain">Keep Exploring</span>
}

export default function Play({ onBack }) {
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guess, setGuess] = useState(null)
  const [actual, setActual] = useState(null)
  const [roundScore, setRoundScore] = useState(null)
  const [distanceKm, setDistanceKm] = useState(null)

  const [round, setRound] = useState(1)
  const [totalScore, setTotalScore] = useState(0)
  const [seenIds, setSeenIds] = useState([])
  const [gameOver, setGameOver] = useState(false)

  // keep a ref so handleNext always has fresh seenIds without stale closures
  const seenIdsRef = useRef([])

  const loadRandom = useCallback(async (exclude) => {
    setLoading(true)
    setError(null)
    setGuess(null)
    setActual(null)
    setRoundScore(null)
    setDistanceKm(null)
    try {
      const qs = exclude.length ? `?exclude=${exclude.join(',')}` : ''
      const res = await fetch(`${API}/photos/random${qs}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load photo')
      }
      setPhoto(await res.json())
    } catch (e) {
      setError(e.message)
      setPhoto(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRandom([])
  }, [loadRandom])

  const handleGuess = async (lat, lng) => {
    if (!photo?.id) return
    setGuess({ lat, lng })
    try {
      const res = await fetch(`${API}/photos/${photo.id}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      })
      if (!res.ok) throw new Error('Guess failed')
      const data = await res.json()
      setRoundScore(data.score)
      setActual(data.actual)
      setDistanceKm(data.distanceKm)
      setTotalScore(prev => prev + data.score)
      const next = [...seenIdsRef.current, photo.id]
      seenIdsRef.current = next
      setSeenIds(next)
    } catch {
      setRoundScore(0)
      setGuess(null)
    }
  }

  const handleNext = () => {
    if (round >= ROUNDS) {
      setGameOver(true)
    } else {
      setRound(r => r + 1)
      loadRandom(seenIdsRef.current)
    }
  }

  const handleRestart = () => {
    seenIdsRef.current = []
    setRound(1)
    setTotalScore(0)
    setSeenIds([])
    setGameOver(false)
    loadRandom([])
  }

  // --- Game over screen ---
  if (gameOver) {
    const maxScore = ROUNDS * 5000
    return (
      <div className="play">
        <header className="play-header">
          <button className="btn-back" onClick={onBack}>← Back</button>
          <h1>PhotoGuessr</h1>
        </header>
        <div className="game-over">
          <div className="game-over-card">
            <div className="game-over-trophy">🏆</div>
            <h2>Game complete</h2>
            <ScoreRating score={totalScore} total={maxScore} />
            <div className="final-score-wrap">
              <span className="final-score-num">{totalScore.toLocaleString()}</span>
              <span className="final-score-denom">/ {maxScore.toLocaleString()} pts</span>
            </div>
            <div className="game-over-actions">
              <button className="btn-primary" onClick={handleRestart}>Play again</button>
              <button className="btn-secondary" onClick={onBack}>Home</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- Loading / error states ---
  const photoUrl = photo?.filename ? `/uploads/${photo.filename}` : null

  if (loading && !photo) {
    return (
      <div className="play">
        <header className="play-header">
          <button className="btn-back" onClick={onBack}>← Back</button>
          <h1>PhotoGuessr</h1>
        </header>
        <div className="play-loading">
          <div className="spinner" />
          <span>Loading photo…</span>
        </div>
      </div>
    )
  }

  if (error && !photo) {
    return (
      <div className="play">
        <header className="play-header">
          <button className="btn-back" onClick={onBack}>← Back</button>
          <h1>PhotoGuessr</h1>
        </header>
        <div className="play-error">
          <p>{error}</p>
          <button className="btn-primary" onClick={() => loadRandom([])}>Try again</button>
        </div>
      </div>
    )
  }

  // --- Main play screen ---
  return (
    <div className="play">
      <header className="play-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h1 className="play-title">Where was this taken?</h1>
        <div className="header-right">
          <span className="round-badge">Round {round}/{ROUNDS}</span>
          <span className="score-badge">{totalScore.toLocaleString()} pts</span>
        </div>
      </header>

      <div className="play-layout">
        <div className="photo-panel">
          <div className="photo-wrap">
            {photoUrl && <img src={photoUrl} alt="Guess the location" />}
          </div>
          {photo?.hint && <p className="hint">Hint: {photo.hint}</p>}
          {guess == null && <p className="photo-cta">Click on the map to place your guess</p>}
        </div>

        <div className="map-panel">
          <MapContainer center={[20, 0]} zoom={2} className="guess-map" zoomControl>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GuessMap onGuess={handleGuess} disabled={guess != null} />
            {guess && (
              <PinMarker position={[guess.lat, guess.lng]} color="#ef4444" label="Your guess" />
            )}
            {actual && (
              <>
                <PinMarker position={[actual.lat, actual.lng]} color="#22c55e" label="Actual location" />
                <Polyline
                  positions={[[guess.lat, guess.lng], [actual.lat, actual.lng]]}
                  pathOptions={{ color: '#94a3b8', weight: 2, dashArray: '6 4', opacity: 0.75 }}
                />
              </>
            )}
          </MapContainer>

          {roundScore != null && (
            <div className="result">
              <div className="result-stats">
                <div className="result-stat">
                  <span className="result-val">{distanceKm != null ? `${Math.round(distanceKm).toLocaleString()} km` : '—'}</span>
                  <span className="result-label">off target</span>
                </div>
                <div className="result-divider" />
                <div className="result-stat">
                  <span className="result-val result-val-score">+{roundScore.toLocaleString()}</span>
                  <span className="result-label">points</span>
                </div>
              </div>
              <button className="btn-primary result-next" onClick={handleNext}>
                {round >= ROUNDS ? 'See final score' : `Next round →`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
