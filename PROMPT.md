# Prompt: MERN Video Streaming Platform (HLS)

## Role
Act as a Senior Full Stack MERN Developer. Build a complete, working video streaming platform similar to a basic YouTube, with real code in real files (not snippets or explanations only).

## Tech Stack
- Frontend (client): React.js (Vite), JavaScript, Axios, HLS.js, plain CSS (responsive, dark theme)
- Backend (server): Node.js, Express.js, MongoDB, Mongoose, Multer, FFmpeg (fluent-ffmpeg), HLS
- Use ES6 modules (import/export) everywhere ("type": "module").

## Features
**User:** list videos, play via HLS.js, play/pause/seek/volume, quality selection (when available), show title, description, upload date, responsive UI.
**Admin:** upload MP4 with title and description, list videos, delete videos, see processing status (pending / processing / completed / failed).

## Streaming Workflow
1. Admin uploads MP4 from React.
2. Axios sends multipart/form-data to Node.js.
3. Multer stores the file temporarily in `storage/uploads`.
4. API saves a Video document (status `pending`) and responds immediately (202).
5. FFmpeg converts the file to HLS in the background: `.m3u8` playlist plus `.ts` segments, ideally multiple renditions (360p/720p) with a master playlist for quality selection.
6. FFmpeg also generates a thumbnail and duration is read with ffprobe.
7. Processed files go to `storage/processed/<videoId>/`.
8. MongoDB is updated: `hlsPlaylist`, `thumbnail`, `duration`, and `processingStatus = completed` only after FFmpeg finishes successfully. On error set `failed` and clean up.
9. React fetches video info via API (poll status while processing).
10. HLS.js loads the `.m3u8` and plays it (native HLS fallback for Safari).

## REST APIs
- `POST   /api/videos/upload`       upload video + metadata, start processing (admin)
- `GET    /api/videos`              list videos
- `GET    /api/videos/:id`          video details
- `DELETE /api/videos/:id`          delete video and all files (admin)
- `GET    /api/videos/stream/:id/*` serve playlist/segments with correct MIME types
  (`application/vnd.apple.mpegurl` for .m3u8, `video/mp2t` for .ts), with path-traversal protection

## Mongoose Video Model
title, description, originalFile, hlsPlaylist, thumbnail, processingStatus (enum), duration, createdAt

## Frontend Pages
Home (video cards grid), Video Player page, Admin Upload page (with progress bar), Admin Manage page (table with status + delete).
Dark YouTube-inspired design, responsive, loading indicators, error messages.

## Quality Requirements
- Clean reusable code; separate routes, controllers, services, models, middlewares.
- Environment variables for all config (MONGO_URI, PORT, CLIENT_URL, ADMIN_API_KEY, MAX_FILE_SIZE, FFMPEG paths). No hardcoded credentials; provide `.env.example`.
- Validate file type (MP4 only, check mimetype and extension) and size limits.
- Central error handler, async handler wrapper, CORS, helmet, basic rate limiting.
- Protect admin routes (API key or JWT) and prevent unauthorized file access / path traversal.
- README.md with full install and setup (Node, MongoDB, FFmpeg install, env setup, run commands).
- Include all npm dependencies in both package.json files.

## Development Instructions
1. Inspect the existing project directory first. If empty, create the folder structure below.
2. Build backend first, then frontend, then integrate.
3. Explain each major step in simple language (for interview preparation).
4. Finally: install dependencies, check MongoDB connection, check FFmpeg availability, test upload, HLS generation and playback, and fix errors.

## Project Folder Structure
```
video-streaming-app/
├── README.md
├── PROMPT.md
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   ├── server.js                      # entry: connect DB, start server
│   ├── storage/
│   │   ├── uploads/                   # temp Multer files
│   │   └── processed/                 # HLS output: <videoId>/index.m3u8, *.ts, thumb.jpg
│   └── src/
│       ├── app.js                     # express app, middlewares, routes
│       ├── config/
│       │   ├── env.js
│       │   └── db.js
│       ├── models/
│       │   └── Video.js
│       ├── controllers/
│       │   └── video.controller.js
│       ├── routes/
│       │   ├── index.js
│       │   └── video.routes.js
│       ├── services/
│       │   ├── video.service.js       # DB logic
│       │   ├── ffmpeg.service.js      # HLS + thumbnail + ffprobe
│       │   └── storage.service.js     # file cleanup, safe paths
│       ├── middlewares/
│       │   ├── upload.middleware.js   # Multer config + validation
│       │   ├── adminAuth.middleware.js
│       │   └── error.middleware.js
│       └── utils/
│           ├── ApiError.js
│           └── asyncHandler.js
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        │   ├── axios.js
        │   └── videoApi.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── VideoCard.jsx
        │   ├── HlsPlayer.jsx
        │   ├── StatusBadge.jsx
        │   ├── Loader.jsx
        │   └── ErrorMessage.jsx
        ├── pages/
        │   ├── Home.jsx
        │   ├── VideoPlayer.jsx
        │   ├── AdminUpload.jsx
        │   └── AdminManage.jsx
        ├── hooks/
        │   └── useVideos.js
        ├── utils/
        │   └── formatters.js
        └── styles/
            ├── global.css
            └── components.css
```
