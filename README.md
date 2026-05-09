# PhotoGuessr

A GeoGuessr-style game where **users upload their own photos** and others guess where the photo was taken on a world map.

- **Play**: Get a random user-submitted photo and click on the map to guess the location. Score up to 5000 points based on how close you are.
- **Submit**: Upload a photo, click on the map to set where it was taken, and add an optional hint. Your photo enters the pool for others to guess.

## Run locally

```bash
npm install
npm run dev
```

This starts the Vite dev server (frontend) at http://localhost:5173 and the API at http://localhost:3001. The frontend proxies `/api` and `/uploads` to the server.

## Tech

- **Frontend**: React, Vite, Leaflet (react-leaflet)
- **Backend**: Express, Multer (file uploads), JSON file storage

Photos are stored in `server/uploads/` and metadata in `server/photos.json`. No database required for a single-machine setup.
