import { useState, useRef } from 'react'
import { MapContainer, TileLayer, useMapEvents, Marker } from 'react-leaflet'
import L from 'leaflet'
import './Submit.css'

const API = '/api'

function LocationPicker({ position, onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  if (!position) return null
  const icon = L.divIcon({
    className: 'submit-marker',
    html: `<span style="background:#6366f1;width:22px;height:22px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:block;"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
  return <Marker position={[position.lat, position.lng]} icon={icon} />
}

export default function Submit({ onBack }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [position, setPosition] = useState(null)
  const [hint, setHint] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)

  const acceptFile = (f) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setDone(false)
    setError(null)
  }

  const onFileChange = (e) => acceptFile(e.target.files?.[0])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    acceptFile(e.dataTransfer.files?.[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !position) {
      setError('Please choose a photo and click on the map to set its location.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('photo', file)
      form.append('lat', position.lat)
      form.append('lng', position.lng)
      if (hint.trim()) form.append('hint', hint.trim())
      const res = await fetch(`${API}/photos`, { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }
      setDone(true)
      setFile(null)
      setPreview(null)
      setPosition(null)
      setHint('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="submit">
      <header className="submit-header">
        <button type="button" className="btn-back" onClick={onBack}>← Back</button>
        <h1>Submit a photo</h1>
      </header>

      <div className="submit-content">
        <form className="submit-form" onSubmit={handleSubmit}>

          {/* Drop zone */}
          <div className="form-group">
            <label>Photo</label>
            <div
              className={`dropzone ${dragging ? 'dropzone-active' : ''} ${file ? 'dropzone-filled' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="dropzone-preview" />
              ) : (
                <div className="dropzone-placeholder">
                  <span className="dropzone-icon">🖼</span>
                  <span className="dropzone-text">
                    {dragging ? 'Drop it!' : 'Drag & drop or click to choose'}
                  </span>
                  <span className="dropzone-sub">JPEG, PNG, WebP, GIF · max 10 MB</span>
                </div>
              )}
            </div>
            {file && (
              <p className="file-name">{file.name}</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onFileChange}
              className="file-input-hidden"
            />
          </div>

          {/* Hint */}
          <div className="form-group">
            <label>Hint <span className="label-optional">(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. Europe, beach town, mountains…"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
            />
          </div>

          {/* Map */}
          <div className="form-group">
            <label>Location — click the map where the photo was taken</label>
            <div className="map-wrap">
              <MapContainer center={[20, 0]} zoom={2} className="submit-map" zoomControl>
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker position={position} onPick={(lat, lng) => setPosition({ lat, lng })} />
              </MapContainer>
            </div>
            {position ? (
              <p className="position-text">
                <span className="position-dot" />
                {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
              </p>
            ) : (
              <p className="position-text position-empty">No location selected yet</p>
            )}
          </div>

          {error && <p className="form-error">{error}</p>}
          {done && <p className="form-success">Photo submitted! It's now in the pool for others to guess.</p>}

          <button type="submit" className="btn-primary btn-submit" disabled={loading}>
            {loading ? (
              <><span className="btn-spinner" /> Uploading…</>
            ) : 'Submit photo'}
          </button>
        </form>
      </div>
    </div>
  )
}
