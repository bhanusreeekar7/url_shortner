# URL Shortener

A simple web app that turns long, messy links into short ones you can share easily. Paste a URL, get a short link, and anyone who opens it lands on the original page.

## How it works

1. You paste a long URL into the app.
2. The server generates a short code and stores the mapping.
3. Visiting the short link redirects to the original URL.

## Project structure

```
url_shortner/
├── client/   # Frontend (the UI you interact with)
├── server/   # Backend (creates and resolves short links)
└── README.md
```

## Getting started

### Prerequisites

- Node.js (v18 or later)
- npm
- A database connection string, if the server uses one

### 1. Clone the repo

```bash
git clone https://github.com/bhanusreeekar7/url_shortner.git
cd url_shortner
```

### 2. Start the server

```bash
cd server
npm install
npm start
```

Create a `.env` file in `server/` if needed:

```
PORT=5000
DB_URI=your_database_url
BASE_URL=http://localhost:5000
```

### 3. Start the client

```bash
cd client
npm install
npm start
```

Then open the URL shown in your terminal (usually `http://localhost:3000`).

## Usage

1. Open the app in your browser.
2. Paste a long URL and submit.
3. Copy the short link and share it.

## Roadmap

- Custom short links
- Click analytics
- Link expiry

## Author

Made by [Bhanu](https://github.com/bhanusreeekar7).
