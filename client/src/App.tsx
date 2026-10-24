import { useState, useEffect, useRef } from "react";
import { background, shockwave, type BackgroundHandle } from "asciify-engine/kit";
import "./App.css";

interface User {
  id: number;
  name: string;
  email: string;
}

interface ShortUrl {
  id: number;
  original_url: string;
  short_code: string;
  clicks: number;
  created_at: string;
}

const API = import.meta.env.VITE_API_URL || "http://localhost:5003/api";
const REDIRECT_BASE = (import.meta.env.VITE_REDIRECT_BASE || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : "http://localhost:5003")).replace(/\/+$/, '');

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");
  const [copyId, setCopyId] = useState<number | null>(null);

  const heroRef = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<BackgroundHandle | null>(null);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!heroRef.current) return;

    const bg = background(heroRef.current, {
      preset: shockwave,
      clear: copyRef.current ?? undefined,
      cursor: "lantern",
      color: "#8f8d86",
      speed: 1,
      cellSize: 10,
      opacity: 1,
      mark: "glyph",
      dither: 0,
      text: "ASCIIFY",
      look: {
        scene: "flow",
      },
    });

    bgRef.current = bg;

    return () => {
      bg.destroy();
      bgRef.current = null;
    };
  }, []);

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not logged in");
      })
      .then((data) => {
        setUser(data.user);
        fetchUrls();
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function fetchUrls() {
    try {
      const res = await fetch(`${API}/urls`, {
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setUrls(data.urls);
      }
    } catch (err) {
      console.error("Failed to fetch URLs:", err);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setUser(data.user);
      setEmail("");
      setPassword("");
      fetchUrls();
      (bgRef.current?.field as any)?.pulse?.({
        element: submitBtnRef.current,
      });
    } else {
      setError(data.error || data.message || "Login failed");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setUser(data.user);
      setName("");
      setEmail("");
      setPassword("");
      fetchUrls();
      (bgRef.current?.field as any)?.pulse?.({
        element: submitBtnRef.current,
      });
    } else {
      setError(data.error || data.message || "Registration failed");
    }
  }

  async function handleLogout() {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    setUrls([]);
  }

  async function handleShorten(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch(`${API}/urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ originalUrl: newUrl }),
    });

    const data = await res.json();

    if (res.ok) {
      setUrls([data, ...urls]);
      setNewUrl("");

      (bgRef.current?.field as any)?.pulse?.({
        element: submitBtnRef.current,
      });
    } else {
      setError(data.error || "Failed to shorten URL");
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`${API}/urls/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      setUrls(urls.filter((u) => u.id !== id));
    }
  }

  function handleCopy(shortCode: string, id: number) {
    const shortLink = `${REDIRECT_BASE}/r/${shortCode}`;

    navigator.clipboard.writeText(shortLink);
    setCopyId(id);

    setTimeout(() => setCopyId(null), 2000);
  }

  return (
    <div id="hero" ref={heroRef}>
      <div ref={copyRef} className="copy">
        <header className="header">
          <h1 className="logo">
            <span>Snip</span>
          </h1>

          {user && (
            <div className="header-right">
              <span className="text-muted">Hey, {user.name}</span>
              <button className="btn-secondary" onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
        </header>

        {loading ? (
          <div className="center-screen">
            <p className="text-muted">Connecting to session...</p>
          </div>
        ) : !user ? (
          <div className="auth-wrapper">
            <div className="auth-card">
              <h2>{isRegister ? "Create account" : "Welcome back"}</h2>

              <p className="text-muted">
                {isRegister
                  ? "Sign up to start shortening URLs"
                  : "Log in to manage your links"}
              </p>

              {error && <div className="error-msg">{error}</div>}

              <form onSubmit={isRegister ? handleRegister : handleLogin}>
                {isRegister && (
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                )}

                <input
                  className="input-field"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input
                  className="input-field"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  ref={submitBtnRef}
                  className="btn-primary full-width"
                  type="submit"
                >
                  {isRegister ? "Sign Up" : "Log In"}
                </button>
              </form>

              <p className="toggle-text">
                {isRegister
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <button
                  className="link-btn"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError("");
                  }}
                >
                  {isRegister ? "Log in" : "Sign up"}
                </button>
              </p>
            </div>
          </div>
        ) : (
          <main className="dashboard">
            <form className="shorten-bar" onSubmit={handleShorten}>
              <input
                className="input-field"
                type="url"
                placeholder="Paste a long URL here (e.g. https://github.com)..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
              />

              <button
                ref={submitBtnRef}
                className="btn-primary"
                type="submit"
              >
                Shorten
              </button>
            </form>

            {error && <div className="error-msg">{error}</div>}

            {urls.length === 0 ? (
              <p
                className="text-muted"
                style={{ textAlign: "center", marginTop: "3rem" }}
              >
                No links yet — shorten your first URL above!
              </p>
            ) : (
              <div className="url-list">
                {urls.map((u) => (
                  <div key={u.id} className="url-card">
                    <div className="url-info">
                      <a
                        className="short-link"
                        href={`${REDIRECT_BASE}/r/${u.short_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {REDIRECT_BASE.replace(/^https?:\/\//, '')}/r/{u.short_code}
                      </a>

                      <p className="original-url">{u.original_url}</p>
                    </div>

                    <div className="url-actions">
                      <span className="click-badge">{u.clicks} clicks</span>

                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => handleCopy(u.short_code, u.id)}
                      >
                        {copyId === u.id ? "✓ Copied!" : "Copy"}
                      </button>

                      <button
                        className="btn-danger btn-sm"
                        onClick={() => handleDelete(u.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}