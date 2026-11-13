# StreamPulse - MERN HLS Video Streaming Platform

A production-ready full-stack video streaming platform inspired by YouTube, built with MongoDB, Express.js, React (Vite), and Node.js. It features background transcoding with FFmpeg into HTTP Live Streaming (HLS) multi-bitrate adaptive streams (`.m3u8` and `.ts`), thumbnail extraction, and adaptive playback with `hls.js`.

---

## 🌟 Architecture & Streaming Workflow

```
[React Client] --(MP4 Upload via Axios)--> [Express / Multer]
                                                  |
                                    (Save 'pending' to MongoDB)
                                                  |
                                    (202 Accepted Response)
                                                  |
                                     [FFmpeg Background Worker]
                                      ├── ffprobe: duration & metadata
                                      ├── thumbnail generation
                                      └── HLS encoding (360p / 720p)
                                                  |
                                     (Save 'completed' to MongoDB)
                                                  |
[React Client] <--(HLS Stream: .m3u8 / .ts)------┘
```

1. **Upload**: Admin selects an MP4 file. Axios streams multipart data with real-time percentage progress.
2. **Immediate Acknowledgment**: Express saves a record with status `pending` and immediately responds with HTTP `202 Accepted`.
3. **Background Transcoding**:
   - `ffprobe` retrieves exact video duration and dimensions.
   - FFmpeg extracts a high-quality video thumbnail (`thumbnail.jpg`).
   - FFmpeg transcodes the video into adaptive multi-bitrate HLS streams (`360p.m3u8` and `720p.m3u8`) with 4-second `.ts` segments, plus a master playlist (`master.m3u8`).
4. **Database Completion**: MongoDB document is updated with `processingStatus = 'completed'`, duration, and playlist path. Temporary upload files are cleaned up.
5. **Adaptive Playback**: The frontend uses `hls.js` to automatically adjust resolution based on network bandwidth or let the user manually pick quality (Auto, 720p, 360p).

---

## ⚙️ Prerequisites

Before running the application, make sure you have:

1. **Node.js** (v18+ or v20+)
2. **FFmpeg & FFprobe** installed and added to your system `PATH`.
   - Windows: Download from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) or install via `winget install Gyan.FFmpeg` / `choco install ffmpeg`.
   - Verify with: `ffmpeg -version`
3. **MongoDB**
   - Local MongoDB Community Server running on `mongodb://127.0.0.1:27017`
   - OR a free [MongoDB Atlas](https://www.mongodb.com/atlas) cloud connection string.

---

## 🚀 Step-by-Step Setup & Run

### 1. Backend Setup

```bash
cd server
npm install
```

Configure your environment variables in `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/video_streaming
CLIENT_URL=http://localhost:5173
ADMIN_API_KEY=admin_secret_key_123
MAX_FILE_SIZE=104857600
FFMPEG_PATH=
FFPROBE_PATH=
```

Start the backend:
```bash
npm run dev
# or: npm start
```
The server will start at `http://localhost:5000`.

---

### 2. Frontend Setup

In a new terminal:
```bash
cd client
npm install
```

Verify your environment variables in `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_ADMIN_API_KEY=admin_secret_key_123
```

Start the React dev server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Server health check | Public |
| `GET` | `/api/videos` | List all videos (filter by `?status=completed`) | Public |
| `GET` | `/api/videos/:id` | Get details of a single video | Public |
| `POST` | `/api/videos/upload` | Upload MP4 video and metadata (`multipart/form-data`) | Admin (`x-api-key`) |
| `DELETE` | `/api/videos/:id` | Delete video, HLS files, and database record | Admin (`x-api-key`) |
| `GET` | `/api/videos/stream/:id/*` | Stream HLS playlist (`.m3u8`) or segment (`.ts`) | Public |
| `GET` | `/api/videos/:id/thumbnail` | Fetch extracted thumbnail image | Public |

---

## 💡 Interview Prep: Key Engineering Concepts

- **Why HLS instead of direct MP4 streaming?**
  Direct MP4 downloads require high bandwidth and struggle on fluctuating networks. HLS splits video into 4-6 second chunks (`.ts`) and multiple bitrates. The client dynamically switches quality (Adaptive Bitrate Streaming - ABR) without buffering.
- **Why HTTP 202 Accepted for upload?**
  Transcoding high-resolution videos takes time. Blocking the HTTP upload connection until transcoding finishes causes gateway timeouts (504). Returning 202 immediately and doing transcode asynchronously ensures a responsive API.
- **Path Traversal Protection**:
  When streaming dynamically requested segment filenames (`/stream/:id/*`), user input must be sanitized and verified with `path.resolve` to ensure it cannot escape the video's directory (`../../`).
