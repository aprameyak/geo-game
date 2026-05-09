import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(__dirname, 'photos.json');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function loadPhotos() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function savePhotos(photos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /image\/(jpeg|png|webp|gif)/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only images (JPEG, PNG, WebP, GIF) allowed'));
  },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/photos', (req, res) => {
  const photos = loadPhotos();
  res.json(photos);
});

app.get('/api/photos/random', (req, res) => {
  const photos = loadPhotos();
  if (photos.length === 0) {
    return res.status(404).json({ error: 'No photos yet. Upload one first!' });
  }
  const exclude = req.query.exclude ? req.query.exclude.split(',').filter(Boolean) : [];
  const pool = exclude.length > 0
    ? (photos.filter(p => !exclude.includes(p.id)) || photos)
    : photos;
  const available = pool.length > 0 ? pool : photos;
  const random = available[Math.floor(Math.random() * available.length)];
  res.json({ ...random, lat: undefined, lng: undefined });
});

app.get('/api/photos/:id', (req, res) => {
  const photos = loadPhotos();
  const photo = photos.find((p) => p.id === req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  res.json(photo);
});

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function scoreFromKm(km) {
  if (km <= 0) return 5000;
  return Math.round(5000 * Math.exp(-km / 2000));
}

app.post('/api/photos/:id/guess', express.json(), (req, res) => {
  const { lat, lng } = req.body || {};
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  if (Number.isNaN(numLat) || Number.isNaN(numLng)) {
    return res.status(400).json({ error: 'lat and lng required' });
  }
  const photos = loadPhotos();
  const photo = photos.find((p) => p.id === req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  const distanceKm = haversineKm(photo.lat, photo.lng, numLat, numLng);
  const score = scoreFromKm(distanceKm);
  res.json({
    distanceKm,
    score,
    actual: { lat: photo.lat, lng: photo.lng },
  });
});

app.post('/api/photos', upload.single('photo'), (req, res) => {
  const { lat, lng, hint } = req.body;
  if (req.file == null) {
    return res.status(400).json({ error: 'Photo file required' });
  }
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  if (Number.isNaN(numLat) || Number.isNaN(numLng)) {
    return res.status(400).json({ error: 'Valid lat and lng required' });
  }
  const photos = loadPhotos();
  const id = path.basename(req.file.filename, path.extname(req.file.filename));
  const photo = {
    id,
    filename: req.file.filename,
    lat: numLat,
    lng: numLng,
    hint: hint || '',
    createdAt: new Date().toISOString(),
  };
  photos.push(photo);
  savePhotos(photos);
  res.status(201).json(photo);
});

app.listen(PORT, () => {
  console.log(`PhotoGuessr API running at http://localhost:${PORT}`);
});
