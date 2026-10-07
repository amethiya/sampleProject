import { useEffect, useState } from "react";
import Logo from "../Logo";
import { api } from "../api";
import { linkProps, navigate } from "../router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/me").then(() => navigate("/app")).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/login", { method: "POST", body: JSON.stringify({ email, password }) });
      navigate("/app");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <aside className="login-art" aria-hidden="true">
        <a {...linkProps("/")} className="login-home"><Logo inverse /></a>
        <div className="radar">
          <div className="radar-sweep" />
          <span className="blip" style={{ top: "28%", left: "62%" }} />
          <span className="blip" style={{ top: "58%", left: "30%", animationDelay: "1.4s" }} />
          <span className="blip" style={{ top: "70%", left: "66%", animationDelay: "2.6s" }} />
          <span className="blip" style={{ top: "38%", left: "22%", animationDelay: "3.3s" }} />
        </div>
        <p>Every sweep finds businesses whose websites stopped changing years ago.</p>
      </aside>

      <main className="login-main">
        <form className="login-form" onSubmit={submit}>
          <a {...linkProps("/")} className="login-mobile-logo"><Logo /></a>
          <h1>Sign in</h1>
          <p className="muted">Use the email and password for your Revamp Radar account.</p>
          <label>
            Email
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          <label>
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-lg" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </main>
    </div>
  );
}
