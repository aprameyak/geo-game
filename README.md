# geo-game

![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB&style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white&style=for-the-badge)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white&style=for-the-badge)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?logo=leaflet&logoColor=white&style=for-the-badge)

## About

**geo-game** is a GeoGuessr-style web game where users upload their own photos and others guess where each photo was taken by clicking on a world map. Built with **React, Vite, and Leaflet** on the frontend and **Express** on the backend, it scores guesses up to 5000 points based on geographic distance from the actual location, with user-submitted photos and metadata stored locally on the server.

## Features

- Play mode: receive a random user-submitted photo and click on an interactive Leaflet map to guess its location
- Score calculation based on geographic distance — closer guesses earn more points up to a 5000-point max
- Submit mode: upload a photo, pin its real location on the map, and add an optional hint
- User-submitted photos enter the shared pool and are immediately available for others to guess
- File uploads handled server-side with Multer; photo metadata stored in a flat JSON file
- Vite dev server proxies `/api` and `/uploads` to the Express backend for seamless local development
- Full-stack JavaScript with a single `npm run dev` command starting both client and server concurrently

## Technology Stack

- **Frontend**: React, Vite, Leaflet (react-leaflet)
- **Backend**: Node.js, Express, Multer
