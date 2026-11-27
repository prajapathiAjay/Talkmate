<div align="center">

<img src="frontend/public/logo.svg" alt="JubJub logo: a smiling speech bubble" width="96" />

# JubJub

**Where friends jub jub.** A real-time chat app with a public room, private chats, live typing, photos and unread badges, plus full account management (password reset by email, settings, muting), designed mobile-first with a frosted-glass UI.

[![Live demo](https://img.shields.io/badge/Live%20demo-talkmate--ezzq.onrender.com-8b5cf6?style=for-the-badge)](https://talkmate-ezzq.onrender.com)

![React](https://img.shields.io/badge/React_18-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-0EA5E9?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=white)

<img src="docs/screenshots/chat-desktop.png" alt="JubJub group chat on desktop: messages, a shared photo, a typing indicator and the people panel with an unread badge" width="100%" />

</div>

> The live demo runs on Render's free plan, so the first request after a while can take ~50 seconds while the server wakes up.

---

## 📱 Made for phones too

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/chat-phone.png" alt="Group chat on a phone with someone typing" width="240" /><br /><sub><b>Group chat</b>: live typing, photos</sub></td>
    <td align="center"><img src="docs/screenshots/people-phone.png" alt="People panel on a phone with unread counts" width="240" /><br /><sub><b>People</b>: unread counts per friend</sub></td>
    <td align="center"><img src="docs/screenshots/private-phone.png" alt="Private chat on a phone" width="240" /><br /><sub><b>Private chat</b> with a friend</sub></td>
  </tr>
</table>

<table>
  <tr>
    <td align="center" width="56%"><img src="docs/screenshots/login-desktop.png" alt="Sign-in page on desktop with Remember me and Forgot password" /><br /><sub><b>Sign in</b> (desktop)</sub></td>
    <td align="center"><img src="docs/screenshots/signup-phone.png" alt="Sign-up page on a phone" width="200" /><br /><sub><b>Sign up</b> (phone)</sub></td>
    <td align="center"><img src="docs/screenshots/settings-phone.png" alt="Settings sheet on a phone: mute chat, display name and password" width="200" /><br /><sub><b>Settings</b>: mute, name, password</sub></td>
  </tr>
</table>

---

## ✨ Features

**Messaging**
- ⚡ **Real-time chat** over WebSockets (Socket.IO): a public room for everyone plus 1-to-1 private chats
- ✍️ **Typing indicator** that appears live and clears the moment the message is sent
- 📷 **Photos**: pick from your gallery or take one with the camera (the phone's own camera on mobile, an in-app webcam on desktop), uploaded to Cloudinary
- 🔁 **Nothing gets lost**: if a message can't be sent (server error, no reply within 10 s, or offline), you get an error and your text and photos are put back in the box
- 😀 Emoji picker, multi-line messages (Enter to send, Shift+Enter for a new line)
- 🗓️ Date separators (*Today*, *Yesterday*, weekday) and "X, Y and Z joined the chat" grouping
- 📜 **Scrolls like a real chat app**: opens at the newest message, or at your first unread one under an *Unread messages* divider; loads older messages as you scroll up without moving what you're reading; a **↓ New messages** button instead of yanking you down while you read history

**People & presence**
- 👥 Add friends, search people, online / *last seen* status updated live everywhere (people list, friends list and the chat header)
- 🔴 **Unread badges** per chat, **even for messages that arrived while you were offline**. The server remembers what each user last read, so counts stay correct across reloads and devices.
- 🔕 **Mute** any chat: no unread badges from it, on every device

**Accounts**
- ✅ **Remember me**: stay signed in for 30 days, or untick it on a shared computer to be signed out when the browser closes
- 📧 **Forgot password**: a one-time reset link by email, valid for 30 minutes
- ⚙️ **Settings**: change your display name or password; changing the password signs you out on your other devices
- 📄 Terms and Privacy pages

**Built for mobile**
- 📐 Responsive from 360px phones to wide desktops; the people list becomes a slide-over panel on small screens
- ⌨️ The header stays visible and the input sits right above the **on-screen keyboard** (uses the `visualViewport` API)
- 🖐️ Feels native: no accidental pinch/double-tap zoom, no pull-to-refresh bounce, no tap flashes

**Security**
- 🔐 JWT authentication (30-day "remembered" or 1-day sessions) with a clean "session expired" sign-out
- 🔄 Changing or resetting a password **immediately** invalidates every older login (each token carries a version number the server checks)
- ✉️ Password reset can't be used to discover who has an account (same answer for any email), stores only a hash of the emailed code, works once, and is rate-limited (3 per email per hour)
- 🛡️ Private chats are readable and writable **only by their participants**, both over REST and WebSockets
- 🪪 The sender of every message comes from the login token, so messages can't be sent under someone else's name
- 📤 Uploads require login; attachments must come from the app's own Cloudinary account
- 🔑 Passwords hashed with bcrypt; emails are unique and matched ignoring capitals (`Ajay@…` = `ajay@…`), but stored as typed
- 🙈 Private account fields (reset codes, muted chats, token versions) are never sent to other users

---

## 🧱 Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS 4, React Router 7, React Hook Form + Yup, Socket.IO client, Axios, Emoji Mart, Sonner (toasts), Lucide icons |
| **Backend** | Node.js, Express 5, Socket.IO, Mongoose, JSON Web Tokens, bcrypt, Multer, Nodemailer |
| **Data & media** | MongoDB Atlas, Cloudinary, any SMTP email provider (Gmail, Resend, …) |
| **Hosting** | Render (frontend + backend) |

---

## 🏗️ Architecture

```mermaid
flowchart LR
    subgraph Client["Browser (React + Vite)"]
        UI["Chat UI"]
        API["Axios (REST)"]
        WS["Socket.IO client"]
    end

    subgraph Server["Node.js server"]
        REST["Express REST API<br/>auth · users · rooms · friends · messages · unread · settings"]
        RT["Socket.IO<br/>join-room · sendMessage · typing · notifications"]
        AUTH["JWT auth<br/>(HTTP + socket handshake)"]
    end

    DB[("MongoDB Atlas<br/>users · rooms · messages<br/>friends · read states")]
    CDN[("Cloudinary<br/>images")]
    MAIL[("SMTP<br/>reset emails")]

    UI --> API --> AUTH --> REST
    UI <--> WS <--> AUTH
    AUTH --> RT
    REST --> DB
    RT --> DB
    REST -- "uploads" --> CDN
    REST -- "password reset" --> MAIL
```

**How a message travels**
1. The sender's browser emits `sendMessage` over the socket.
2. The server checks that the sender belongs to the room, takes their identity from the JWT, and saves the message in MongoDB.
3. It broadcasts the message to everyone currently in that room, and sends a small `message-notification` to everyone else who should see it (private: the other participant; public: everyone online). That's what drives the live unread badges.

**How unread counts survive being offline.** A `ReadState` document stores when each user last read each chat. On sign-in (and whenever the socket reconnects), the app asks `GET /api/room/unread`, which counts other people's messages newer than that time. Opening a chat calls `POST /api/room/:roomId/read`.

---

## 📁 Project structure

```
.
├── backend/
│   ├── app.js                  # Express app, CORS, routes
│   ├── server.js               # HTTP server + Socket.IO + MongoDB connection
│   └── src/
│       ├── config/             # MongoDB and Cloudinary setup
│       ├── features/           # one folder per feature: routes → controller → repository → schema
│       │   ├── user/           #   sign-up / sign-in / users list / settings / password reset
│       │   ├── room/           #   public & private rooms, unread counts, read states
│       │   ├── friend/
│       │   ├── message/
│       │   └── cloudinaryupload/
│       ├── middlewares/        # JWT auth (HTTP + socket), uploads, error handler
│       ├── realTime/           # online / offline presence
│       ├── socket/             # Socket.IO events
│       └── utils/              # login tokens, input rules, email sending, search
├── frontend/
│   ├── index.html
│   ├── public/                 # logo and app icons
│   └── src/
│       ├── pages/              # Login, Chat, ChatHeader, MessageItem, MessageInput, OnlineUsers, ResetPassword, Legal…
│       ├── components/         # routing, camera capture, settings
│       ├── contexts/           # AuthProvider: session, current room, unread counts, muted chats
│       ├── services/           # Axios client
│       ├── utils/              # session & Remember me, input rules, avatar colours, date formatting
│       └── index.css           # theme tokens (colours, glass, buttons)
└── docs/screenshots/
```

---

## 🚀 Getting started

### Prerequisites
- Node.js 20+
- A MongoDB database (local or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- A free [Cloudinary](https://cloudinary.com) account (for photo messages)

### 1. Clone
```bash
git clone https://github.com/prajapathiAjay/TalkMate.git
cd TalkMate
```

### 2. Backend
```bash
cd backend
npm install
```
Create `backend/.env` with **your own** values (placeholders shown):
```env
PORT=5000
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<a-long-random-secret>
JWT_EXPIRES_IN=30d          # length of a "Remember me" login (others last 1 day)
NODE_ENV=development
FRONTEND_URI=http://localhost:5173   # used to build password-reset links

CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>

# Optional: email for "Forgot password". Without these, the reset link is
# printed in the backend console instead, which is handy for local testing.
SMTP_HOST=smtp.gmail.com     # Resend: smtp.resend.com
SMTP_PORT=465
SMTP_USER=<your-gmail-address>        # Resend: resend
SMTP_PASS=<your-gmail-app-password>   # Resend: your API key
MAIL_FROM="JubJub <your-gmail-address>"
```

> Gmail needs 2-step verification turned on to create an [app password](https://myaccount.google.com/apppasswords).

> 🔒 Keep real credentials only in `.env` (it's git-ignored) and in your hosting provider's environment settings. Never commit them or paste them into issues or READMEs.
```bash
npm run dev        # starts on http://localhost:5000
```

### 3. Frontend
```bash
cd ../frontend
npm install
```
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=api
```
```bash
npm run dev        # opens on http://localhost:5173
```

The shared public room is created automatically the first time the backend starts.

> 📱 To try it on your phone, run `npm run dev -- --host` in `frontend/` and open the *Network* URL on the same Wi-Fi.

---

## 🔌 API overview

All endpoints except sign-up, sign-in, forgot-password and reset-password need `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/user/signUp` | Create an account (returns a token) |
| `POST` | `/api/user/signIn` | Sign in (returns a token; `rememberMe: false` for a 1-day login) |
| `POST` | `/api/user/forgot-password` | Email a reset link (`{ email }`) |
| `POST` | `/api/user/reset-password` | Set a new password with the emailed code (`{ token, password }`) |
| `PATCH` | `/api/user/profile` | Change your display name (`{ name }`) |
| `PATCH` | `/api/user/password` | Change your password (`{ currentPassword, newPassword }`); returns a fresh token |
| `POST` | `/api/user/logout` | Sign out |
| `GET` | `/api/user/allUsers?name=&isOnline=` | List / search users |
| `POST` | `/api/room/createRoom` | Start a private chat with a user (`{ friendId }`) |
| `GET` | `/api/room/private?name=` | Your private chats, with the other person's details |
| `GET` | `/api/room/unread` | Unread counts per chat `{ roomId: count }` and your muted chats |
| `POST` | `/api/room/:roomId/read` | Mark a chat as read |
| `POST` | `/api/room/:roomId/mute` | Mute or unmute a chat (`{ muted: true \| false }`) |
| `GET` | `/api/messages/getMessages?roomId=&limit=&before=` | A page of a room's messages (newest 50 by default; `before=<message id>` for older ones) plus `hasMore` |
| `POST` | `/api/friend/add` | Add a friend |
| `GET` | `/api/friend/getFriends` | Your friends |
| `POST` | `/api/upload/messages` | Upload up to 3 images, 10 MB each (multipart `files`) |

**Socket.IO events** (the connection is authenticated with the JWT in `auth.token`)

| Direction | Event | Purpose |
|---|---|---|
| client → server | `join-room` | Open a chat (refused with `room-error` if you're not a member) |
| client → server | `sendMessage` | Send a message / photos (acknowledged) |
| client → server | `typing`, `stop-typing` | Typing indicator (the server also clears it if you leave the chat or disconnect) |
| client → server | `refresh-profile` | Use your new display name after renaming |
| server → client | `message` | New message in the open chat (only after it's saved) |
| server → client | `message-notification` | New message elsewhere → unread badge |
| server → client | `userTyping`, `userStopTyping` | Someone is typing |
| server → client | `user-status-changed` | Someone came online / went offline |

---

## ☁️ Deployment

The live version runs on **Render** (a *Web Service* for the backend and a *Static Site* for the frontend) with **MongoDB Atlas**.

- **Backend:** build `npm install`, start `npm start`, and set the environment variables above in Render. Set `FRONTEND_URI` to your live frontend URL and add the `SMTP_*` settings so reset emails are actually sent.
- **Frontend:** build `npm install && npm run build`, publish `dist/`, set `VITE_API_URL` to the backend URL, and add a rewrite of `/*` → `/index.html` so routes like `/chat`, `/reset-password` and `/terms` work on refresh.
- **CORS:** the allowed frontend origin is set in `backend/app.js` and `backend/src/socket/socketLogic.js`. Update it if your frontend URL changes.
- **Atlas free tier:** clusters pause after ~60 days without connections. If the backend logs `querySrv ENOTFOUND`, resume the cluster in Atlas.

---

## 🗺️ Roadmap

- [ ] Read receipts (✓ / ✓✓)
- [x] Message pagination (load older messages on scroll)
- [ ] Installable PWA with push notifications
- [ ] Reply / react to a message
- [ ] Group chats beyond the public room

---

## 👤 Author

**Ajay Prajapathi**: [GitHub @prajapathiAjay](https://github.com/prajapathiAjay)

If you like the project, a ⭐ on the repo is appreciated!
