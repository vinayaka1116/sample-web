import { lazy, Suspense, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  BarChart3,
  BrainCircuit,
  ChartNoAxesCombined,
  ShieldAlert,
  BriefcaseBusiness,
  RefreshCw,
  ArrowUpRight,
  Search,
  Plus,
  X,
  Activity,
  TrendingUp,
  TrendingDown,
  UserCircle,
  LogOut,
  Mail,
  LockKeyhole,
  CalendarDays,
  Clock3,
  Globe2,
  Bot,
  Send,
  Sparkles,
  Gauge,
  ShieldCheck,
  SearchCheck,
  ScrollText,
} from "lucide-react";

import "./App.css";
import { API_BASE, authApi, portfolioApi } from "./services/api";
import { TermsAndConditions } from "./components/common/TermsAndConditions";

const API = API_BASE;
const MarketGlobe = lazy(() =>
  import("./components/common/MarketGlobe").then(({ MarketGlobe: Component }) => ({
    default: Component,
  }))
);

const STOCKS = [
  {
    name: "Reliance Industries",
    symbol: "RELIANCE.NS",
    short: "R",
    color: "purple",
  },
  {
    name: "TCS",
    symbol: "TCS.NS",
    short: "T",
    color: "blue",
  },
  {
    name: "HDFC Bank",
    symbol: "HDFCBANK.NS",
    short: "H",
    color: "green",
  },
  {
    name: "Infosys",
    symbol: "INFY.NS",
    short: "I",
    color: "orange",
  },
  {
    name: "ICICI Bank",
    symbol: "ICICIBANK.NS",
    short: "I",
    color: "red",
  },
  {
    name: "State Bank of India",
    symbol: "SBIN.NS",
    short: "S",
    color: "blue",
  },
  {
    name: "Bharti Airtel",
    symbol: "BHARTIARTL.NS",
    short: "B",
    color: "red",
  },
  {
    name: "ITC",
    symbol: "ITC.NS",
    short: "IT",
    color: "orange",
  },
];

const NAV_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "AI Assistant", icon: Bot },
  { name: "Markets", icon: BarChart3 },
  { name: "AI Prediction", icon: BrainCircuit },
  { name: "Technical Analysis", icon: ChartNoAxesCombined },
  { name: "Risk Analysis", icon: ShieldAlert },
  { name: "Portfolio", icon: BriefcaseBusiness },
  { name: "Calendar", icon: CalendarDays },
  { name: "Terms & Conditions", icon: ScrollText },
];


function LoginScreen({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoginError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setLoginError("Enter your email and password.");
      return;
    }

    if (isRegister && (!name || name.trim().length < 2)) {
      setLoginError("Please enter your full name.");
      return;
    }

    if (isRegister && password.length < 12) {
      setLoginError("Use a password with at least 12 characters.");
      return;
    }

    if (isRegister && !ageConfirmed) {
      setLoginError("You must confirm that you are at least 18 years old.");
      return;
    }

    if (isRegister && !termsAccepted) {
      setLoginError("You must accept the Terms & Conditions to create an account.");
      return;
    }

    setSubmitting(true);

    try {
      if (isRegister) {
        const res = await authApi.register(name.trim(), cleanEmail, password, ageConfirmed, termsAccepted);
        if (res?.user) {
          onLogin(authApi.saveSession(res));
          return;
        }
      } else {
        const res = await authApi.login(cleanEmail, password);
        if (res?.user) {
          onLogin(authApi.saveSession(res));
          return;
        }
      }
    } catch (err) {
      console.warn("Auth API request failed:", err);
      const detail = err.response?.data?.detail;
      setLoginError(
        detail || (typeof err.message === "string" ? err.message : "Authentication failed. Check credentials.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .login-screen {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow-x: hidden;
          overflow-y: auto;
          padding: 24px 0;
          background: #050509;
          color: #f5f5f7;
          font-family: inherit;
        }
        .login-background-glow {
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          filter: blur(110px);
          opacity: .22;
          pointer-events: none;
        }
        .glow-one { background: #ef4444; top: -260px; left: -180px; }
        .glow-two { background: #ef4444; right: -220px; bottom: -280px; }
        .login-card {
          width: min(440px, calc(100vw - 32px));
          position: relative;
          z-index: 2;
          padding: 34px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 28px;
          background: linear-gradient(145deg, rgba(20,20,29,.94), rgba(8,8,13,.97));
          box-shadow: 0 30px 100px rgba(0,0,0,.55), 0 0 80px rgba(139,92,246,.10);
          backdrop-filter: blur(24px);
        }
        .login-brand { display:flex; align-items:center; gap:14px; margin-bottom:28px; }
        .login-brand-icon {
          width:52px; height:52px; display:grid; place-items:center; border-radius:16px;
          color:#ef4444; background:rgba(168,85,247,.12); border:1px solid rgba(168,85,247,.25);
          box-shadow:0 0 28px rgba(168,85,247,.16);
        }
        .login-brand strong { display:block; font-size:27px; letter-spacing:-1px; }
        .login-brand strong span { color:#ef4444; }
        .login-brand small { display:block; margin-top:3px; color:#777782; font-size:9px; letter-spacing:2.4px; }
        
        .auth-tabs {
          display: flex; gap: 6px; padding: 4px; border-radius: 14px;
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
          margin-bottom: 22px;
        }
        .auth-tab {
          flex: 1; height: 38px; border: 0; border-radius: 10px;
          background: transparent; color: #8e8e96; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: .2s ease;
        }
        .auth-tab.active {
          background: #ef4444; color: #fff; box-shadow: 0 4px 16px rgba(239,68,68,.35);
        }

        .login-heading { margin-bottom:20px; }
        .login-heading h1 { margin:6px 0 6px; font-size:32px; letter-spacing:-1.2px; }
        .login-heading p { margin:0; color:#858590; line-height:1.5; font-size: 13px; }
        .login-form { display:flex; flex-direction:column; gap:10px; }
        .login-form label { margin-top:6px; color:#b6b6c0; font-size:12px; font-weight:600; }
        .login-input-wrap {
          display:flex; align-items:center; gap:11px; height:50px; padding:0 14px;
          border:1px solid rgba(255,255,255,.09); border-radius:14px; background:#0d0d14; color:#777784;
          transition:.2s ease;
        }
        .login-input-wrap:focus-within { border-color:rgba(239,68,68,.65); box-shadow:0 0 0 3px rgba(239,68,68,.12); }
        .login-input-wrap input { flex:1; min-width:0; border:0; outline:0; background:transparent; color:#fff; font-size:14px; }
        .login-input-wrap input::placeholder { color:#555560; }
        .password-toggle { border:0; background:transparent; color:#ef4444; cursor:pointer; font-size:12px; font-weight:700; }
        .login-error { padding:10px 12px; margin-top:4px; border:1px solid rgba(239,68,68,.25); border-radius:10px; color:#fca5a5; background:rgba(239,68,68,.08); font-size:12px; }
        .login-submit {
          height:52px; margin-top:14px; display:flex; align-items:center; justify-content:center; gap:9px;
          border:0; border-radius:14px; color:#fff; background:linear-gradient(135deg,#ef4444,#ef4444);
          box-shadow:0 14px 35px rgba(239,68,68,.25); font-size:15px; font-weight:800; cursor:pointer;
        }
        .login-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .demo-login { margin-top:16px; padding:12px 14px; border:1px solid rgba(239,68,68,.2); border-radius:13px; background:rgba(239,68,68,.04); display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; font-size:11px; cursor: pointer; transition: .2s ease; }
        .demo-login:hover { background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.4); }
        .demo-login span { grid-column:1/-1; color:#ef4444; font-size:9px; letter-spacing:1.8px; font-weight:800; margin-bottom:2px; }
        .demo-login strong { color:#a9a9b2; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .login-switch-btn { margin-top: 14px; background: none; border: 0; color: #a1a1aa; font-size: 12px; cursor: pointer; text-align: center; }
        .login-switch-btn strong { color: #ef4444; margin-left: 4px; }
        .login-footer { display:flex; align-items:center; justify-content:center; gap:7px; margin-top:20px; color:#5f5f69; font-size:11px; }
        .profile-wrapper { position:relative; }
        .profile-menu {
          position:absolute; right:0; top:58px; width:280px; z-index:1000; padding:14px;
          border:1px solid rgba(255,255,255,.10); border-radius:18px;
          background:rgba(14,14,22,.98); box-shadow:0 24px 60px rgba(0,0,0,.5); backdrop-filter:blur(20px);
        }
        .profile-menu-head { display:flex; align-items:center; gap:11px; padding:5px 3px 13px; }
        .profile-menu-avatar { width:42px; height:42px; border-radius:13px; display:grid; place-items:center; background:linear-gradient(135deg,#ef4444,#ef4444); color:#fff; font-weight:900; }
        .profile-menu-head strong { display:block; color:#f4f4f5; font-size:13px; }
        .profile-menu-head span { display:block; color:#777783; font-size:10px; margin-top:4px; }
        .profile-menu-status { display:flex; align-items:center; gap:8px; padding:10px 11px; border-radius:11px; background:rgba(34,197,94,.06); color:#8f9599; font-size:11px; }
        .logout-button { width:100%; height:42px; margin-top:10px; display:flex; align-items:center; justify-content:center; gap:8px; border:1px solid rgba(239,68,68,.16); border-radius:11px; background:rgba(239,68,68,.05); color:#fca5a5; cursor:pointer; font-weight:700; }
        @media (max-width:600px) { .login-card { padding:26px 22px; } .login-heading h1 { font-size:28px; } }
      `}</style>
      <div className="login-screen">
      <div className="login-background-glow glow-one"></div>
      <div className="login-background-glow glow-two"></div>

      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <BrainCircuit size={30} />
          </div>
          <div>
            <strong>Stock<span>AI</span></strong>
            <small>MARKET INTELLIGENCE</small>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isRegister ? "active" : ""}`}
              onClick={() => { setIsRegister(false); setLoginError(""); setAgeConfirmed(false); setTermsAccepted(false); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegister ? "active" : ""}`}
              onClick={() => { setIsRegister(true); setLoginError(""); setAgeConfirmed(false); setTermsAccepted(false); }}
          >
            Register
          </button>
        </div>

        <div className="login-heading">
          <span className="eyebrow">{isRegister ? "CREATE ACCOUNT" : "SECURE ACCESS"}</span>
          <h1>{isRegister ? "Join StockAI" : "Welcome back"}</h1>
          <p>{isRegister ? "Create your personal stock intelligence profile." : "Sign in to access your portfolio and market analytics."}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" aria-busy={submitting}>
          {isRegister && (
            <>
              <label htmlFor="auth-name">Full Name</label>
              <div className="login-input-wrap">
                <UserCircle size={18} />
                <input
                  id="auth-name"
                  type="text"
                  placeholder="e.g. Vinayaka Bankapur"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  maxLength={120}
                />
              </div>
            </>
          )}

          <label htmlFor="auth-email">Email</label>
          <div className="login-input-wrap">
            <Mail size={18} />
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              maxLength={254}
            />
          </div>

          <label htmlFor="auth-password">Password</label>
          <div className="login-input-wrap">
            <LockKeyhole size={18} />
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              placeholder={isRegister ? "At least 12 characters" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={isRegister ? 12 : 1}
              maxLength={256}
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {isRegister && (
            <div className="auth-consent-options">
              <label className="auth-consent">
                <input type="checkbox" checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} />
                <span>I confirm that I am at least 18 years old.</span>
              </label>
              <label className="auth-consent">
                <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
                <span>I agree to the StockAI Terms &amp; Conditions.</span>
              </label>
              <button className="auth-terms-link" type="button" onClick={() => setShowTerms(true)}>
                Read Terms &amp; Conditions
              </button>
            </div>
          )}

          {loginError && (
            <div className="login-error" role="alert">{loginError}</div>
          )}

          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting
              ? isRegister ? "Creating Account..." : "Signing In..."
              : isRegister ? "Create Account" : "Sign In"}
            <ArrowUpRight size={18} />
          </button>
        </form>

        <button
          type="button"
          className="login-switch-btn"
          onClick={() => { setIsRegister(!isRegister); setLoginError(""); setAgeConfirmed(false); setTermsAccepted(false); }}
        >
          {isRegister ? "Already registered?" : "Don't have an account?"}
          <strong>{isRegister ? "Sign In" : "Register now"}</strong>
        </button>

        <div className="login-footer">
          <span className="live-dot"></span>
          StockAI secure session
        </div>
      </div>
    </div>
      {showTerms && <TermsAndConditions onClose={() => setShowTerms(false)} />}
    </>
  );
}

function App() {
  const [page, setPage] = useState("Dashboard");
  const [shareToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("share"));
  const [sharedPortfolio, setSharedPortfolio] = useState(null);
  const [sharedPortfolioError, setSharedPortfolioError] = useState("");
  const [shareLoading, setShareLoading] = useState(() => Boolean(
    new URLSearchParams(window.location.hash.slice(1)).get("share")
  ));

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!shareToken) return;
    let active = true;
    portfolioApi.getSharedPortfolio(shareToken)
      .then((items) => {
        if (active) setSharedPortfolio(items);
      })
      .catch((err) => {
        if (active) setSharedPortfolioError(
          err.response?.data?.detail || "This portfolio share link is invalid or has been revoked."
        );
      })
      .finally(() => {
        if (active) setShareLoading(false);
      });
    return () => {
      active = false;
    };
  }, [shareToken]);

  useEffect(() => {
    let active = true;
    authApi.me()
      .then((account) => {
        if (!active) return;
        if (!account) throw new Error("Session did not return an account.");
        setUser(account);
      })
      .catch(() => {
        if (!active) return;
        authApi.clearSession();
        setUser(null);
      })
      .finally(() => {
        if (active) setAuthChecked(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const [profileOpen, setProfileOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingLstm, setLoadingLstm] = useState(false);

  const [error, setError] = useState("");

  const [portfolio, setPortfolio] = useState([]);
  const [portfolioShareUrl, setPortfolioShareUrl] = useState("");
  const [portfolioShareStatus, setPortfolioShareStatus] = useState("");

  const [showPortfolioModal, setShowPortfolioModal] =
    useState(false);

  const [portfolioSymbol, setPortfolioSymbol] =
    useState("RELIANCE.NS");

  const [portfolioQuantity, setPortfolioQuantity] =
    useState("");

  const [portfolioBuyPrice, setPortfolioBuyPrice] =
    useState("");

  // Load persisted portfolio from SQLite backend
  useEffect(() => {
    if (!user?.email) return;
    let alive = true;
    portfolioApi
      .getPortfolio()
      .then((items) => {
        if (alive && Array.isArray(items)) {
          const normalized = items.map((it) => ({
            ...it,
            buyPrice: it.buy_price ?? it.buyPrice ?? 0,
          }));
          setPortfolio(normalized);
        }
      })
      .catch((err) => {
        console.warn("Could not load backend portfolio:", err);
      });

    return () => {
      alive = false;
    };
  }, [user?.email]);

  if (!authChecked) {
    return <div className="login-screen" role="status">Checking secure session…</div>;
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={(account) => {
          setUser(account);
          setProfileOpen(false);
        }}
      />
    );
  }

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Server session could not be revoked:", err);
    } finally {
      authApi.clearSession();
      setProfileOpen(false);
      setUser(null);
      setPortfolio([]);
    }
  };

  /* =====================================================
     STOCK ANALYSIS
     ===================================================== */

  const analyzeStock = async (selectedSymbol = symbol) => {
    const stock = String(selectedSymbol || '').toUpperCase().trim();
    if (!stock) { setError('Please select or enter a stock symbol.'); return; }

    setLoading(true);
    setLoadingLstm(true);
    setError('');
    setSymbol(stock);

    const requests = await Promise.allSettled([
      axios.get(`${API}/api/stocks/${stock}`, { timeout: 120000 }),
      axios.get(`${API}/api/technical/${stock}`, { timeout: 120000 }),
      axios.get(`${API}/api/risk/${stock}`, { timeout: 120000 }),
      axios.get(`${API}/api/prediction/${stock}`, { timeout: 180000 }),
    ]);

    const [market, technical, risk, xgb] = requests;
    const detail = (r) => r.reason?.response?.data?.detail || r.reason?.message || 'Request failed';
    const errors = [];
    if (market.status === 'rejected') errors.push(`Market: ${detail(market)}`);
    if (technical.status === 'rejected') errors.push(`Technical: ${detail(technical)}`);
    if (risk.status === 'rejected') errors.push(`Risk: ${detail(risk)}`);
    if (xgb.status === 'rejected') errors.push(`XGBoost: ${detail(xgb)}`);

    const next = {
      symbol: stock,
      market: market.status === 'fulfilled' ? market.value.data : null,
      technical: technical.status === 'fulfilled' ? technical.value.data : null,
      risk: risk.status === 'fulfilled' ? risk.value.data : null,
      prediction: { xgboost: xgb.status === 'fulfilled' ? xgb.value.data : null, lstm: null },
    };
    setData(next);
    setLoading(false);

    try {
      const lstm = await axios.get(`${API}/api/prediction/${stock}/lstm`, { timeout: 300000 });
      setData(prev => ({ ...(prev || next), prediction: { ...(prev?.prediction || next.prediction), lstm: lstm.data } }));
    } catch (e) {
      console.error('LSTM error:', e);
      errors.push(`LSTM: ${detail(e)}`);
    } finally {
      setLoadingLstm(false);
    }

    if (errors.length) setError(errors.join(' | '));
  };

  /* =====================================================
     REFRESH
     ===================================================== */

  const refreshAnalysis = () => {
    if (symbol) {
      analyzeStock(symbol);
    }
  };

  /* =====================================================
     AI DECISION ENGINE
     ===================================================== */

  const getAIDecision = () => {
    if (!data?.prediction) {
      return {
        decision: "—",
        reason: "Analyze a stock to generate AI decision.",
        confidence: null,
        status: "neutral",
      };
    }

    const xgb = data.prediction.xgboost;
    const lstm = data.prediction.lstm;
    const technical = data.technical;

    const xgbDirection =
      xgb?.direction?.toUpperCase() || null;

    const lstmDirection =
      lstm?.signal?.toUpperCase() || null;

    const technicalDirection =
      technical?.overall_signal?.toUpperCase() || null;

    /*
     * Decision logic:
     *
     * BUY:
     * models/technical are mostly bullish
     *
     * SELL:
     * models/technical are mostly bearish
     *
     * HOLD:
     * signals disagree or are neutral
     */

    let bullish = 0;
    let bearish = 0;

    if (xgbDirection === "BULLISH") bullish++;
    if (xgbDirection === "BEARISH") bearish++;

    if (lstmDirection === "BULLISH") bullish++;
    if (lstmDirection === "BEARISH") bearish++;

    if (technicalDirection === "BULLISH") bullish++;
    if (technicalDirection === "BEARISH") bearish++;

    let decision = "HOLD";
    let status = "neutral";

    if (bullish >= 2 && bullish > bearish) {
      decision = "BUY";
      status = "positive";
    } else if (bearish >= 2 && bearish > bullish) {
      decision = "SELL";
      status = "negative";
    }

    /*
     * Confidence:
     *
     * XGBoost already provides confidence.
     *
     * We do NOT invent an LSTM confidence because
     * the current LSTM backend does not return one.
     */

    let confidence = null;

    if (
      typeof xgb?.confidence === "number"
    ) {
      confidence = xgb.confidence;
    }

    return {
      decision,
      status,
      confidence,
      reason: `Decision based on XGBoost, LSTM and technical signals.`,
    };
  };

  const aiDecision = getAIDecision();

  /* =====================================================
     ADD PORTFOLIO
     ===================================================== */

  const addPortfolioStock = async () => {
    const stock = STOCKS.find(
      (item) => item.symbol === portfolioSymbol
    ) || {
      name: portfolioSymbol,
      symbol: portfolioSymbol,
      short: portfolioSymbol.slice(0, 2),
      color: "blue",
    };

    const quantity = Number(portfolioQuantity);
    const buyPrice = Number(portfolioBuyPrice);

    if (
      !quantity ||
      quantity <= 0 ||
      !buyPrice ||
      buyPrice <= 0
    ) {
      return;
    }

    const payload = {
      name: stock.name,
      symbol: stock.symbol,
      short: stock.short || stock.symbol.slice(0, 2),
      color: stock.color || "blue",
      quantity,
      buy_price: buyPrice,
    };

    try {
      await portfolioApi.addStock(payload);
      const updated = await portfolioApi.getPortfolio();
      setPortfolio(
        updated.map((it) => ({
          ...it,
          buyPrice: it.buy_price ?? it.buyPrice ?? 0,
        }))
      );
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Could not save this portfolio holding.");
      return;
    }

    setPortfolioQuantity("");
    setPortfolioBuyPrice("");
    setShowPortfolioModal(false);
  };

  const removePortfolioStock = async (stockIdentifier) => {
    let targetSymbol = null;

    if (typeof stockIdentifier === "string") {
      targetSymbol = stockIdentifier;
    } else if (typeof stockIdentifier === "object" && stockIdentifier?.symbol) {
      targetSymbol = stockIdentifier.symbol;
    } else if (typeof stockIdentifier === "number") {
      targetSymbol = portfolio[stockIdentifier]?.symbol;
    }

    if (targetSymbol) {
      try {
        await portfolioApi.removeStock(targetSymbol);
        const updated = await portfolioApi.getPortfolio();
        setPortfolio(
          updated.map((it) => ({
            ...it,
            buyPrice: it.buy_price ?? it.buyPrice ?? 0,
          }))
        );
        return;
      } catch (err) {
        setError(err.response?.data?.detail || err.message || "Could not remove this portfolio holding.");
        return;
      }
    }
  };

  const createPortfolioShare = async () => {
    try {
      const token = await portfolioApi.createShare();
      if (!token) throw new Error("The server did not return a share link.");
      const shareUrl = `${window.location.origin}${window.location.pathname}#share=${encodeURIComponent(token)}`;
      setPortfolioShareUrl(shareUrl);
      try {
        await navigator.clipboard.writeText(shareUrl);
        setPortfolioShareStatus("Read-only link copied. Anyone with the link can view these holdings.");
      } catch {
        setPortfolioShareStatus("Read-only link created. Copy it below to share.");
      }
    } catch (err) {
      setPortfolioShareStatus(err.response?.data?.detail || err.message || "Could not create share link.");
    }
  };

  const revokePortfolioShare = async () => {
    try {
      await portfolioApi.revokeShare();
      setPortfolioShareUrl("");
      setPortfolioShareStatus("All portfolio share links have been revoked.");
    } catch (err) {
      setPortfolioShareStatus(err.response?.data?.detail || err.message || "Could not revoke share links.");
    }
  };

  /* =====================================================
     RENDER
     ===================================================== */

  if (shareToken) {
    if (shareLoading) return <div className="login-screen" role="status">Loading shared portfolio…</div>;
    if (sharedPortfolioError) return <div className="login-screen" role="alert">{sharedPortfolioError}</div>;
    if (sharedPortfolio) return <SharedPortfolioView portfolio={sharedPortfolio} />;
  }

  return (
    <>
      <style>{`
        .profile-wrapper { position: relative; }
        .profile-menu { position:absolute; right:0; top:58px; width:280px; z-index:1000; padding:14px; border:1px solid rgba(255,255,255,.10); border-radius:18px; background:rgba(14,14,22,.98); box-shadow:0 24px 60px rgba(0,0,0,.5); backdrop-filter:blur(20px); }
        .profile-menu-head { display:flex; align-items:center; gap:11px; padding:5px 3px 13px; }
        .profile-menu-avatar { width:42px; height:42px; border-radius:13px; display:grid; place-items:center; background:linear-gradient(135deg,#ef4444,#ef4444); color:#fff; font-weight:900; }
        .profile-menu-head strong { display:block; color:#f4f4f5; font-size:13px; }
        .profile-menu-head span { display:block; color:#777783; font-size:10px; margin-top:4px; }
        .profile-menu-status { display:flex; align-items:center; gap:8px; padding:10px 11px; border-radius:11px; background:rgba(34,197,94,.06); color:#8f9599; font-size:11px; }
        .logout-button { width:100%; height:42px; margin-top:10px; display:flex; align-items:center; justify-content:center; gap:8px; border:1px solid rgba(239,68,68,.16); border-radius:11px; background:rgba(239,68,68,.05); color:#fca5a5; cursor:pointer; font-weight:700; }
      `}</style>
    <div className="app">

      {/* =================================================
          SIDEBAR
          ================================================= */}

      <aside className="sidebar">

        <div className="logo">
          <BrainCircuit size={28} />
          <span>
            Stock<span className="purple">AI</span>
          </span>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav ${
                  page === item.name ? "active" : ""
                }`}
                onClick={() => setPage(item.name)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="model-box">
          <small>AI MODEL</small>
          <h3>LSTM + XGBoost</h3>
          <p>AI Stock Intelligence</p>
        </div>

      </aside>

      {/* =================================================
          MAIN
          ================================================= */}

      <main className="main">

        <header>

          <div>
            <span className="eyebrow">
              MARKET INTELLIGENCE
            </span>

            <h1>{page}</h1>
          </div>

          <div className="header-right">

            <button
              className="refresh-button"
              onClick={refreshAnalysis}
              disabled={loading}
              title="Refresh analysis"
            >
              <RefreshCw
                size={20}
                className={
                  loading ? "spin" : ""
                }
              />
            </button>

            <div className="live-status">
              <span className="live-dot"></span>
              LIVE
            </div>

            <div className="header-clock">
              <Clock3 size={16} />
              <span>{now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
              <strong>{now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</strong>
            </div>

            <div className="profile-wrapper">
              <button
                className="profile"
                onClick={() => setProfileOpen((value) => !value)}
                title="Open profile"
                type="button"
              >
                {user?.initials || "VB"}
              </button>

              {profileOpen && (
                <div className="profile-menu">
                  <div className="profile-menu-head">
                    <div className="profile-menu-avatar">
                      {user?.initials || "VB"}
                    </div>
                    <div>
                      <strong>{user?.name || "Vinayaka Bankapur"}</strong>
                      <span>{user?.email}</span>
                    </div>
                  </div>

                  <div className="profile-menu-status">
                    <span className="live-dot"></span>
                    Account active
                  </div>

                  <button
                    type="button"
                    className="logout-button"
                    onClick={logout}
                  >
                    <LogOut size={17} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        <div className="page-content">

          {/* =================================================
              ERROR
              ================================================= */}

          {error && (
            <div className="error">
              <span>{error}</span>

              <button
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* =================================================
              DASHBOARD
              ================================================= */}

          {page === "Dashboard" && (
            <Dashboard
              now={now}
              symbol={symbol}
              setSymbol={setSymbol}
              data={data}
              loading={loading}
              analyzeStock={analyzeStock}
              aiDecision={aiDecision}
              stocks={STOCKS}
            />
          )}

          {/* =================================================
              AI ASSISTANT
              ================================================= */}

          {page === "AI Assistant" && (
            <AIAssistant
              symbol={symbol}
              data={data}
              stocks={STOCKS}
              analyzeStock={analyzeStock}
              loading={loading}
            />
          )}

          {/* =================================================
              MARKETS
              ================================================= */}

          {page === "Markets" && (
            <Markets
              stocks={STOCKS}
              analyzeStock={analyzeStock}
              loading={loading}
            />
          )}

          {/* =================================================
              AI PREDICTION
              ================================================= */}

          {page === "AI Prediction" && (
            <Prediction
              symbol={symbol}
              data={data}
              loading={loading}
              loadingLstm={loadingLstm}
              aiDecision={aiDecision}
              stocks={STOCKS}
              analyzeStock={analyzeStock}
            />
          )}

          {/* =================================================
              TECHNICAL
              ================================================= */}

          {page === "Technical Analysis" && (
            <Technical
              symbol={symbol}
              data={data}
              stocks={STOCKS}
              analyzeStock={analyzeStock}
              loading={loading}
            />
          )}

          {/* =================================================
              RISK
              ================================================= */}

          {page === "Risk Analysis" && (
            <Risk
              symbol={symbol}
              data={data}
              stocks={STOCKS}
              analyzeStock={analyzeStock}
              loading={loading}
            />
          )}

          {/* =================================================
              PORTFOLIO
              ================================================= */}

          {page === "Portfolio" && (
            <Portfolio
              portfolio={portfolio}
              onAdd={() =>
                setShowPortfolioModal(true)
              }
              onRemove={removePortfolioStock}
              onShare={createPortfolioShare}
              onRevokeShare={revokePortfolioShare}
              shareUrl={portfolioShareUrl}
              shareStatus={portfolioShareStatus}
            />
          )}

          {page === "Calendar" && (
            <MarketCalendar symbol={symbol} data={data} now={now} />
          )}

          {page === "Terms & Conditions" && <TermsAndConditions />}

        </div>
      </main>

      {/* =====================================================
          PORTFOLIO MODAL
          ===================================================== */}

      {showPortfolioModal && (
        <div className="portfolio-modal">

          <div className="portfolio-modal-card">

            <div className="modal-header">

              <div>
                <span className="eyebrow">
                  PORTFOLIO
                </span>

                <h2>Add Stock</h2>
              </div>

              <button
                onClick={() =>
                  setShowPortfolioModal(false)
                }
              >
                <X size={18} />
              </button>

            </div>

            <div className="modal-form">

              <label>Stock</label>

              <select
                value={portfolioSymbol}
                onChange={(e) =>
                  setPortfolioSymbol(e.target.value)
                }
              >
                {STOCKS.map((stock) => (
                  <option
                    key={stock.symbol}
                    value={stock.symbol}
                  >
                    {stock.name} ({stock.symbol})
                  </option>
                ))}
              </select>

              <label>Quantity</label>

              <input
                type="number"
                min="1"
                placeholder="Example: 10"
                value={portfolioQuantity}
                onChange={(e) =>
                  setPortfolioQuantity(
                    e.target.value
                  )
                }
              />

              <label>Buy Price</label>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Example: 1500"
                value={portfolioBuyPrice}
                onChange={(e) =>
                  setPortfolioBuyPrice(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="modal-actions">

              <button
                onClick={() =>
                  setShowPortfolioModal(false)
                }
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={addPortfolioStock}
              >
                Add Stock
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
    </>
  );
}
function MarketPulse() {
  return (
    <section
      style={{
        background: "linear-gradient(155deg, #160c0e, #090909)",
        border: "1px solid rgba(239,68,68,.16)",
        borderRadius: "16px",
        padding: "20px",
        color: "#ffffff",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              color: "#ff737a",
              fontSize: "11px",
              letterSpacing: "2px",
            }}
          >
            LIVE MARKET OVERVIEW
          </div>
          <h2 style={{ margin: "8px 0", fontSize: "20px" }}>
            Market Pulse
          </h2>
          <p style={{ color: "#9ca3af", margin: 0, fontSize: "13px" }}>
            Track market movements and analyze stock trends.
          </p>
        </div>

        <span style={{ color: "#ef4444", fontSize: "28px" }}>◉</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "12px",
          marginTop: "20px",
        }}
      >
        {[
          ["Market Status", "Analytics ready"],
          ["Stock Analysis", "Available"],
          ["AI Insights", "Prediction tools"],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              background: "#160d0e",
              border: "1px solid rgba(239,68,68,.13)",
              borderRadius: "10px",
              padding: "14px",
            }}
          >
            <div style={{ color: "#9ca3af", fontSize: "12px" }}>
              {label}
            </div>
            <div
              style={{
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                marginTop: "8px",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({
  now,
  symbol,
  setSymbol,
  data,
  loading,
  analyzeStock,
  aiDecision,
  stocks,
}) {
  const indiaTimeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const indiaHour = Number(indiaTimeParts.find((part) => part.type === "hour")?.value);
  const indiaMinute = Number(indiaTimeParts.find((part) => part.type === "minute")?.value);
  const indiaWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  }).format(now);
  const marketOpen = indiaWeekday !== "Sat" && indiaWeekday !== "Sun" &&
    (indiaHour > 9 || (indiaHour === 9 && indiaMinute >= 15)) &&
    (indiaHour < 15 || (indiaHour === 15 && indiaMinute < 30));

  const watchlist = [
    { name: "Reliance", symbol: "RELIANCE.NS", price: "2,945.40", change: 1.8 },
    { name: "TCS", symbol: "TCS.NS", price: "3,822.10", change: 0.9 },
    { name: "Infosys", symbol: "INFY.NS", price: "1,536.75", change: -0.4 },
    { name: "HDFC Bank", symbol: "HDFCBANK.NS", price: "1,782.20", change: 1.2 },
    { name: "ICICI Bank", symbol: "ICICIBANK.NS", price: "1,118.30", change: 0.7 },
  ];

  const marketNews = [
    {
      title: "Banking stocks stay resilient as credit demand strengthens",
      source: "Economic Times",
      sentiment: "Bullish",
      tone: "positive",
    },
    {
      title: "IT majors show steady momentum amid lower volatility",
      source: "CNBC India",
      sentiment: "Neutral",
      tone: "neutral",
    },
    {
      title: "Energy sector reacts to crude movement and hedging demand",
      source: "MarketWire",
      sentiment: "Bearish",
      tone: "negative",
    },
  ];

  const expectedChange =
    data?.prediction?.xgboost?.expected_change ??
    data?.prediction?.lstm?.expected_change;
  const summaryCards = [
    {
      label: "AI Signal",
      value: data ? aiDecision.decision || "HOLD" : "—",
      meta: aiDecision.confidence != null ? `${aiDecision.confidence}% model confidence` : "Analyze a stock to see confidence",
      tone: aiDecision.status === "positive" ? "positive" : aiDecision.status === "negative" ? "negative" : "neutral",
    },
    {
      label: "Expected Move",
      value: expectedChange != null ? `${expectedChange > 0 ? "+" : ""}${expectedChange}%` : "—",
      meta: "Model estimate, not a guaranteed return",
      tone: expectedChange > 0 ? "positive" : expectedChange < 0 ? "negative" : "neutral",
    },
    {
      label: "Technical Signal",
      value: data?.technical?.overall_signal || "—",
      meta: data?.technical?.market_score != null ? `Score ${data.technical.market_score}/100` : "Technical data unavailable",
      tone: data?.technical?.market_score >= 60 ? "positive" : data?.technical?.market_score < 40 ? "negative" : "neutral",
    },
    {
      label: "Risk Level",
      value: data?.risk?.risk_level || "—",
      meta: data?.risk?.risk_score != null ? `Risk score ${data.risk.risk_score}/100` : "Risk data unavailable",
      tone: data?.risk?.risk_level?.toLowerCase() === "high" ? "negative" : data?.risk?.risk_level?.toLowerCase() === "low" ? "positive" : "warning",
    },
  ];

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker"><span className="live-dot"></span> GLOBAL MARKET COMMAND CENTER</div>
          <h2>StockAI <span>Market Intelligence</span></h2>
          <p>Real-time market pulse, AI prediction and risk intelligence in one focused workspace.</p>

          <div className="dashboard-metrics">
            <div className={`metric-pill ${data?.market?.change > 0 ? "positive" : data?.market?.change < 0 ? "neutral" : ""}`}>
              <span>Market Pulse</span>
              <strong>{data?.market?.change != null ? `${data.market.change > 0 ? "+" : ""}${data.market.change}%` : "—"}</strong>
            </div>
            <div className="metric-pill neutral">
              <span>AI Confidence</span>
              <strong>{aiDecision.confidence != null ? `${aiDecision.confidence}%` : "—"}</strong>
            </div>
            <div className={`metric-pill ${data?.risk?.risk_level?.toLowerCase() === "high" ? "neutral" : "warning"}`}>
              <span>Risk Mode</span>
              <strong>{data?.risk?.risk_level || "—"}</strong>
            </div>
          </div>

          <SearchBox symbol={symbol} setSymbol={setSymbol} analyzeStock={analyzeStock} loading={loading} />
          <div className="dashboard-quick-row">
            {stocks.slice(0, 5).map((stock) => (
              <button key={stock.symbol} onClick={() => analyzeStock(stock.symbol)} disabled={loading} className="quick-stock">
                <span>{stock.short}</span>{stock.name}
              </button>
            ))}
          </div>
        </div>
        <div className="dashboard-time-card">
          <div className="time-card-brand">
            <span className="time-brand-mark"><ChartNoAxesCombined size={20} /></span>
            <span className="time-brand-name"><strong>STOCKAI</strong><small>INDIA EXCHANGE</small></span>
          </div>
          <span className={`market-session ${marketOpen ? "is-open" : "is-closed"}`}>
            <i />{marketOpen ? "MARKET OPEN" : "MARKET CLOSED"}
          </span>
          <strong className="market-clock-time">
            {now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
          </strong>
          <span className="market-clock-date">
            {now.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </span>
          <span className="market-hours-note"><Clock3 size={13} /> NSE · 09:15 – 15:30 IST</span>
        </div>
      </section>

      <section className="globe-market-grid">
        <div className="market-tray">
          <Suspense fallback={<div className="globe-panel" role="status">Loading global market view…</div>}>
            <MarketGlobe />
          </Suspense>
          <div className="watchlist-panel">
            <div className="watchlist-header">
              <div>
                <span className="eyebrow">WATCHLIST</span>
                <h3>Top movers</h3>
              </div>
              <span className="watchlist-badge">LIVE</span>
            </div>

            <div className="watchlist-list">
              {watchlist.map((stock) => (
                <button key={stock.symbol} className="watchlist-row" onClick={() => analyzeStock(stock.symbol)}>
                  <div className="watchlist-meta">
                    <span className="watchlist-dot" />
                    <div>
                      <strong>{stock.name}</strong>
                      <small>{stock.symbol}</small>
                    </div>
                  </div>
                  <div className="watchlist-price">
                    <span>{stock.price}</span>
                    <em className={stock.change >= 0 ? "positive" : "negative"}>{stock.change >= 0 ? "+" : ""}{stock.change}%</em>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <MarketPulse />
      </section>

      <section className="dashboard-summary">
        {summaryCards.map((card) => (
          <div key={card.label} className={`summary-card ${card.tone}`}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.meta}</small>
          </div>
        ))}
      </section>

      <section className="news-sentiment-panel">
        <div className="news-header">
          <div>
            <span className="eyebrow">MARKET SENTIMENT</span>
            <h3>News & momentum</h3>
          </div>
          <span className="sentiment-pill">Updated now</span>
        </div>

        <div className="news-grid">
          {marketNews.map((item) => (
            <article key={item.title} className="news-card">
              <div className="news-card-top">
                <span className={`news-tag ${item.tone}`}>{item.sentiment}</span>
                <small>{item.source}</small>
              </div>
              <h4>{item.title}</h4>
            </article>
          ))}
        </div>
      </section>

      {data ? (
        <DashboardData data={data} aiDecision={aiDecision} />
      ) : (
        <section className="dashboard-empty-analysis">
          <div className="empty-analysis-icon"><Bot size={24} /></div>
          <div>
            <span className="eyebrow">AI READY</span>
            <h3>Select a stock to open full intelligence</h3>
            <p>StockAI will load market price, technical indicators, risk metrics and LSTM/XGBoost predictions.</p>
          </div>
        </section>
      )}
    </div>
  );
}


/* =========================================================
   STOCKAI AI ASSISTANT
   ========================================================= */


function AIAssistant({ symbol, data, stocks, analyzeStock, loading }) {
  const [question, setQuestion] = useState("");
  const messagesRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Welcome to StockAI Today! 👋 I'm your AI market assistant. Ask me about a stock price, technical indicator, risk, prediction or complete analysis.",
    },
  ]);

  useEffect(() => {
    const messageList = messagesRef.current;
    if (messageList) messageList.scrollTop = messageList.scrollHeight;
  }, [loading, messages]);

  const quickQuestions = [
    { label: "Analyze Reliance", symbol: "RELIANCE.NS" },
    { label: "What is Infosys risk?", symbol: "INFY.NS" },
    { label: "What is TCS RSI?", symbol: "TCS.NS" },
    { label: "Check Nifty trend", symbol: "^NSEI" },
    { label: "Predict HDFC Bank", symbol: "HDFCBANK.NS" },
    { label: "Complete ICICI analysis", symbol: "ICICIBANK.NS" },
  ];
  const expectedChange =
    data?.prediction?.xgboost?.expected_change ??
    data?.prediction?.lstm?.expected_change;

  const ask = (text = question) => {
    const q = text.trim();
    if (!q) return;

    setQuestion("");

    const lower = q.toLowerCase();
    const match = stocks.find(
      (s) =>
        lower.includes(s.name.toLowerCase()) ||
        lower.includes(s.symbol.toLowerCase().replace(".ns", ""))
    );
    const target = match?.symbol || (lower.includes("nifty") ? "^NSEI" : null);
    const activeSymbol = symbol || data?.symbol;
    const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening|namaste)(?:[\s,.!?]+(?:there|stockai))?[.!?]*$/.test(lower);
    const asksForHelp = /\b(help|what can you do|capabilities|how do i use)\b/.test(lower);
    const isThanks = /\b(thanks|thank you|thx)\b/.test(lower);
    const asksForAdvice = /\b(should i buy|should i sell|what should i buy|best stock to buy|guaranteed return)\b/.test(lower);
    const hasMarketIntent = /\b(rsi|macd|risk|beta|volatility|drawdown|sharpe|var|predict|prediction|forecast|price|quote|change|signal|trend|analysis|market|stock|share|buy|sell)\b/.test(lower);
    let reply;

    if (isGreeting) {
      reply = "Hi! I'm StockAI. Ask me about a stock's price, RSI, MACD, risk, trend, or AI forecast, and I'll use the available analysis.";
    } else if (isThanks) {
      reply = "You're welcome. Ask about a stock or choose a quick question whenever you're ready.";
    } else if (asksForHelp) {
      reply = "I can look up a supported stock and explain its latest available price, technical indicators, risk metrics, and model forecasts. Mention a company or ticker to start.";
    } else if (/\b(who are you|what are you|your name)\b/.test(lower)) {
      reply = "I'm StockAI, a market-analysis assistant for stock prices, technical indicators, risk metrics, and model forecasts.";
    } else if (target && (!data || target !== activeSymbol)) {
      analyzeStock(target);
      reply = `Loading the available analysis for ${target}. I'll show the result when it is ready.`;
    } else if (asksForAdvice) {
      reply = data
        ? `I can't tell you whether to buy or sell. The current StockAI signal for ${activeSymbol} is ${data.ai_decision?.decision || data.prediction?.xgboost?.signal || "unavailable"}. Model outputs are estimates, not financial advice.`
        : "I can't provide personalized buy or sell advice. Mention a ticker and I can load its available risk, technical, and model data for you to review.";
    } else if (!data && hasMarketIntent) {
      reply = "I don't have stock data loaded yet. Mention a company or ticker, such as TCS or RELIANCE.NS, and I'll load its analysis.";
    } else if (!data) {
      reply = "I can help with stock-market questions, but I don't have a general-purpose chat model connected. Ask about a supported stock, indicator, risk measure, or forecast.";
    } else {
      const market = data.market || {};
      const technical = data.technical || {};
      const risk = data.risk || {};
      const xgb = data.prediction?.xgboost || {};
      const lstm = data.prediction?.lstm || {};
      const stockLabel = activeSymbol || "the selected stock";

      if (/\brsi\b/.test(lower)) {
        reply = `RSI for ${stockLabel}: ${technical.rsi?.value ?? "unavailable"}. Signal: ${technical.rsi?.signal ?? "unavailable"}.`;
      } else if (/\bmacd\b/.test(lower)) {
        reply = `MACD for ${stockLabel}: ${technical.macd?.value ?? "unavailable"}. Trend: ${technical.macd?.trend ?? "unavailable"}.`;
      } else if (/\b(risk|beta|volatility|drawdown|sharpe|var)\b/.test(lower)) {
        reply = `Risk for ${stockLabel}: ${risk.risk_level ?? "unavailable"}. Volatility: ${risk.volatility ?? "unavailable"}%. Beta: ${risk.beta ?? "unavailable"}. Max drawdown: ${risk.max_drawdown ?? "unavailable"}%.`;
      } else if (/\b(predict|prediction|forecast)\b/.test(lower)) {
        reply = `Available model estimates for ${stockLabel}: XGBoost ₹${xgb.predicted_price ?? "unavailable"}, LSTM ₹${lstm.predicted_price ?? "unavailable"}. These estimates are not guaranteed future prices.`;
      } else if (/\b(price|quote|change|today)\b/.test(lower)) {
        const move = market.change == null ? "unavailable" : `${market.change >= 0 ? "+" : ""}${market.change}%`;
        reply = `${stockLabel} is ₹${formatNumber(market.price)} with a reported daily move of ${move}.`;
      } else if (/\b(signal|trend|technical)\b/.test(lower)) {
        reply = `Technical signal for ${stockLabel}: ${technical.overall_signal ?? "unavailable"}. RSI: ${technical.rsi?.value ?? "unavailable"}; MACD trend: ${technical.macd?.trend ?? "unavailable"}.`;
      } else if (target || /\b(analysis|summary|overview|market)\b/.test(lower)) {
        reply = `${stockLabel}: ₹${formatNumber(market.price)}, daily move ${market.change == null ? "unavailable" : `${market.change >= 0 ? "+" : ""}${market.change}%`}, technical signal ${technical.overall_signal ?? "unavailable"}, risk ${risk.risk_level ?? "unavailable"}, XGBoost forecast ₹${xgb.predicted_price ?? "unavailable"}.`;
      } else {
        reply = "I can answer stock-market questions using the loaded analysis. Try asking about price, RSI, MACD, risk, trend, or forecast; I don't have a general-purpose chat model connected.";
      }
    }

    setMessages((previous) => [
      ...previous,
      { role: "user", text: q },
      { role: "ai", text: reply },
    ]);
  };

  return (
    <div className="stockai-assistant">
      <section className="sa-welcome">
        <div className="sa-welcome-copy">
          <div className="sa-brandline">
            <span className="sa-3d-logo" aria-hidden="true"><Bot size={22} /></span>
            <strong>STOCK<span>AI</span></strong>
            <i />
            <small>AI ASSISTANT</small>
          </div>

          <h2>Welcome to<br /><span>StockAI</span> Today</h2>
          <p>Your personal AI market companion for prices, technical analysis, risk intelligence and model predictions.</p>

          <div className="sa-features">
            <span><TrendingUp size={17} /> Price Analysis</span>
            <span><Activity size={17} /> Technical Analysis</span>
            <span><ShieldCheck size={17} /> Risk Intelligence</span>
            <span><BrainCircuit size={17} /> AI Predictions</span>
          </div>
        </div>

        <div className="sa-portrait" role="img" aria-label="Three-dimensional red and black StockAI assistant artwork">
          <img className="sa-avatar-art" src="/stockai-female-ai.svg" alt="" aria-hidden="true" />
          <div className="sa-avatar-wordmark">
            <strong>STOCK<span>AI</span></strong>
            <small>MARKET INTELLIGENCE</small>
          </div>
        </div>

        <div className="sa-welcome-side">
          <div className="sa-assistant-brand">
            <span className="sa-assistant-brand-logo">
              <img src="/stockai-female-ai.svg" alt="" aria-hidden="true" />
            </span>
            <span className="sa-assistant-brand-copy">
              <strong>STOCKAI</strong>
              <small>FEMALE AI ASSISTANT</small>
            </span>
            <span className="sa-assistant-brand-live"><i />LIVE</span>
          </div>
          <span className="sa-outline-label">ANALYZE / PREDICT / TRADE</span>
          <p>“Better insights.<br />Smarter decisions.”</p>
          <div className="sa-red-line" />
          <div className="sa-mini-status">
            <CalendarDays size={22} />
            <div><small>MARKET ANALYSIS</small><strong>{loading ? "Processing..." : "Ready to assist"}</strong></div>
          </div>
          <div className="sa-mini-status">
            <Activity size={22} />
            <div><small>SELECTED STOCK</small><strong>{symbol || "Choose a stock"}</strong></div>
          </div>
        </div>
      </section>

      <div className="sa-workspace">
        <section className="sa-chat-panel">
          <div className="sa-section-heading">
            <Sparkles size={25} />
            <strong>AI ASSISTANT</strong>
            <i />
            <span>{loading ? "ANALYZING" : "ONLINE"}</span>
          </div>

          <div className="sa-messages" ref={messagesRef}>
            {messages.map((message, index) => (
              <div className={`sa-message sa-${message.role}`} key={index}>
                {message.role === "ai" && <div className="sa-bot-icon"><Bot size={25} /></div>}
                <div className="sa-message-body">
                  <p>{message.text}</p>
                  <small>{message.role === "ai" ? "STOCKAI ASSISTANT" : "YOU"}</small>
                </div>
              </div>
            ))}
            {loading && <div className="sa-loading">StockAI is analyzing market data…</div>}
          </div>

          <form className="sa-inputbar" onSubmit={(event) => { event.preventDefault(); ask(); }}>
            <Sparkles size={21} />
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask me anything about the market..."
              aria-label="Ask StockAI a question"
            />
            <button type="submit" disabled={!question.trim()}>
              <Send size={20} />
            </button>
          </form>
        </section>

        <aside className="sa-right-column">
          <section className="sa-side-card">
            <div className="sa-side-heading">
              <BrainCircuit size={22} />
              <strong>AI MODEL STATUS</strong>
              <span className="sa-online-dot" />
              <small>Online</small>
            </div>
            <div className="sa-model-row">
              <BrainCircuit size={52} />
              <div><span>LSTM Model</span><small>{data?.prediction?.lstm ? "Result received" : "Ready to run"}</small></div>
            </div>
            <div className="sa-model-row">
              <Activity size={22} />
              <div><span>XGBoost Model</span><small>{data?.prediction?.xgboost ? "Result received" : "Ready to run"}</small></div>
            </div>
            <div className="sa-model-row">
              <Globe2 size={22} />
              <div><span>Market Data</span><small>{data?.market ? "Data received" : "Awaiting analysis"}</small></div>
            </div>
          </section>

          <section className="sa-side-card">
            <div className="sa-side-heading">
              <ZapIcon />
              <strong>QUICK QUESTIONS</strong>
            </div>
            <div className="sa-quick-grid">
              {quickQuestions.map((item) => (
                <button key={item.label} onClick={() => {
                  setQuestion(item.label);
                  ask(item.label);
                }} disabled={loading}>
                  <TrendingUp size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section className="sa-side-card sa-context-card">
            <div className="sa-side-heading">
              <ChartNoAxesCombined size={22} />
              <strong>SELECTED STOCK SNAPSHOT</strong>
            </div>
            {data?.market ? (
              <>
                <div className="sa-context-price">
                  <div>
                    <span>{symbol || data.symbol || "Selected stock"}</span>
                    <strong>₹{formatNumber(data.market.price)}</strong>
                  </div>
                  <em className={data.market.change >= 0 ? "positive" : "negative"}>
                    {data.market.change == null ? "—" : `${data.market.change >= 0 ? "+" : ""}${data.market.change}%`}
                  </em>
                </div>
                <div className="sa-context-metrics">
                  <div><span>TECHNICAL</span><strong>{data.technical?.overall_signal ?? "—"}</strong></div>
                  <div><span>RISK</span><strong>{data.risk?.risk_level ?? "—"}</strong></div>
                  <div><span>FORECAST</span><strong>{expectedChange == null ? "—" : `${expectedChange >= 0 ? "+" : ""}${expectedChange}%`}</strong></div>
                </div>
              </>
            ) : (
              <div className="sa-context-empty">
                <strong>No stock loaded</strong>
                <p>Ask about a ticker or choose a quick question to see its available market context.</p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function ZapIcon() {
  return <Sparkles size={22} />;
}
/* =========================================================
   MARKET CALENDAR
   ========================================================= */

function MarketCalendar({ symbol, data, now }) {
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - first + 1;
    return day > 0 && day <= days ? new Date(year, month, day) : null;
  });
  const sameDay = (a,b) => a && b && a.toDateString() === b.toDateString();
  return (
    <div className="calendar-page">
      <div className="page-intro"><span className="eyebrow">MARKET CALENDAR</span><h2>Market Calendar</h2><p>Plan analysis sessions and monitor the current market date and time.</p></div>
      <div className="calendar-layout">
        <section className="calendar-card">
          <div className="calendar-head"><button onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button><div><span>{cursor.toLocaleString("en-IN", { month: "long" })}</span><strong>{year}</strong></div><button onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button></div>
          <div className="calendar-week">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map((d) => <span key={d}>{d}</span>)}</div>
          <div className="calendar-grid">{cells.map((date, i) => <button key={i} disabled={!date} className={`${date && sameDay(date, selected) ? "selected" : ""} ${date && sameDay(date, now) ? "today" : ""}`} onClick={() => date && setSelected(date)}>{date?.getDate()}</button>)}</div>
        </section>
        <aside className="calendar-side-card">
          <div className="calendar-live"><Clock3 size={20} /><span>LIVE MARKET CLOCK</span><strong>{now.toLocaleTimeString("en-IN", { hour12: false })}</strong><small>{now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</small></div>
          <div className="calendar-selected"><span>SELECTED DATE</span><strong>{selected.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong><p>{selected.getDay() === 0 || selected.getDay() === 6 ? "Weekend — markets are normally closed." : "Trading day — use StockAI to analyze a company."}</p></div>
          <div className="calendar-context"><span>ACTIVE STOCK</span><strong>{symbol || "No stock selected"}</strong><small>{data?.market?.price != null ? `₹${formatNumber(data.market.price)} • ${data.market.change >= 0 ? "+" : ""}${data.market.change}%` : "Analyze a stock to attach live context."}</small></div>
        </aside>
      </div>
    </div>
  );
}

/* =========================================================
   SEARCH BOX
   ========================================================= */

function SearchBox({
  symbol,
  setSymbol,
  analyzeStock,
  loading,
}) {
  return (
    <div className="search-box">

      <Search
        size={20}
        className="search-icon"
      />

      <input
        value={symbol}
        onChange={(e) =>
          setSymbol(e.target.value)
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            analyzeStock();
          }
        }}
        placeholder="Search company or stock symbol..."
      />

      <button
        onClick={() => analyzeStock()}
        disabled={loading}
      >
        {loading
          ? "Analyzing..."
          : "Analyze Stock"}
      </button>

    </div>
  );
}

/* =========================================================
   STOCK SELECTOR
   ========================================================= */

function StockSelector({
  stocks,
  analyzeStock,
  loading,
}) {
  return (
    <div className="stock-selector">

      <div className="selector-heading">

        <span>TOP INDIAN STOCKS</span>

        <p>
          Select a stock to start analysis
        </p>

      </div>

      <div className="stock-grid">

        {stocks.map((stock) => (
          <button
            key={stock.symbol}
            className="stock-chip"
            onClick={() =>
              analyzeStock(stock.symbol)
            }
            disabled={loading}
          >

            <span
              className={`stock-icon ${stock.color}`}
            >
              {stock.short}
            </span>

            <span>
              <strong>{stock.name}</strong>
              <small>{stock.symbol}</small>
            </span>

            <ArrowUpRight size={18} />

          </button>
        ))}

      </div>

    </div>
  );
}
/* =========================================================
   DASHBOARD DATA
   ========================================================= */

function DashboardData({
  data,
  aiDecision,
}) {
  const market = data?.market;
  const prediction = data?.prediction;
  const risk = data?.risk || {};

  if (!market) {
    return (
      <section className="dashboard-empty-analysis" role="status">
        <div className="empty-analysis-icon"><Search size={24} /></div>
        <div>
          <span className="eyebrow">MARKET DATA UNAVAILABLE</span>
          <h3>Could not load {data?.symbol || "this stock"}</h3>
          <p>Check the symbol and try again. The rest of StockAI is still available.</p>
        </div>
      </section>
    );
  }

  const predictedPrice =
    prediction?.xgboost?.predicted_price ??
    prediction?.lstm?.predicted_price;

  return (
    <>
      <section className="stock-header">

        <div>
          <small>NSE • EQUITY</small>

          <h2>{market.symbol}</h2>
        </div>

        <div className="price">

          ₹
          {formatNumber(market.price)}

          <span
            className={
              market.change >= 0
                ? "green"
                : "red"
            }
          >
            {market.change >= 0
              ? "+"
              : ""}
            {market.change}%
          </span>

        </div>

      </section>

      <section className="dashboard-analysis-visuals" aria-label="Stock historical price chart">
        <PriceTrendPanel data={data} />
      </section>

      <section className="cards">

        <Metric
          title="Current Price"
          value={`₹${formatNumber(
            market.price
          )}`}
          description="Latest market price"
        />

        <Metric
          title="AI Prediction"
          value={
            predictedPrice
              ? `₹${formatNumber(
                  predictedPrice
                )}`
              : "—"
          }
          description={
            prediction?.xgboost
              ? `${prediction.xgboost.expected_change}% expected`
              : "Prediction unavailable"
          }
        />

        <Metric
          title="AI Signal"
          value={aiDecision.decision}
          description={
            aiDecision.confidence
              ? `${aiDecision.confidence}% XGBoost confidence`
              : "Model analysis"
          }
          valueClass={
            aiDecision.status === "positive"
              ? "green"
              : aiDecision.status ===
                "negative"
              ? "red"
              : ""
          }
        />

        <Metric
          title="Risk Level"
          value={risk.risk_level || "—"}
          description={
            risk.volatility != null
              ? `${risk.volatility}% volatility`
              : "Risk unavailable"
          }
        />

      </section>

      <section className="analysis-grid dashboard-analysis-grid" aria-label="AI prediction, technical analysis, and risk analysis">
        <PredictionPanel data={data} confidence={aiDecision.confidence} decision={aiDecision.decision} />
        <TechnicalPanel data={data} />
        <RiskPanel data={data} />
      </section>
    </>
  );
}

function ScoreGauge({ label, value, color, detail, unit = "%" }) {
  const numericValue = Number(value);
  const available = value != null && Number.isFinite(numericValue);
  const score = available ? Math.min(100, Math.max(0, numericValue)) : 0;

  return (
    <div className="dashboard-gauge-item">
      <div
        className="dashboard-gauge"
        role="img"
        aria-label={`${label}: ${available ? `${Math.round(numericValue)} out of 100` : "unavailable"}`}
        style={{
          background: `conic-gradient(${color} ${score}%, rgba(255,255,255,.08) ${score}% 100%)`,
          "--gauge-color": color,
        }}
      >
        <span>{available ? Math.round(numericValue) : "—"}<small>{available ? unit : ""}</small></span>
      </div>
      <strong>{label}</strong>
      <span>{detail}</span>
    </div>
  );
}

function PriceTrendPanel({ data }) {
  const history = (data.technical?.history || [])
    .filter((point) => Number.isFinite(Number(point.close)))
    .slice(-60)
    .map((point) => ({
      ...point,
      close: Number(point.close),
      sma20: Number.isFinite(Number(point.sma20)) ? Number(point.sma20) : null,
      sma50: Number.isFinite(Number(point.sma50)) ? Number(point.sma50) : null,
    }));

  return (
    <div className="panel dashboard-price-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">HISTORICAL TREND</span>
          <h2>Price & moving averages</h2>
        </div>
        <Activity size={21} />
      </div>
      {history.length > 1 ? (
        <>
          <div className="dashboard-chart-legend" aria-label="Chart legend">
            <span><i className="legend-price" /> Close</span>
            <span><i className="legend-sma20" /> SMA 20</span>
            <span><i className="legend-sma50" /> SMA 50</span>
          </div>
          <div className="dashboard-price-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardPriceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => String(value).slice(5)}
                  minTickGap={32}
                  tick={{ fill: "#777b86", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => formatNumber(value)}
                  width={58}
                  tick={{ fill: "#777b86", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: "#14161d", border: "1px solid #2a2d36", borderRadius: 10 }}
                  labelStyle={{ color: "#b8bbc4", fontSize: 11 }}
                  formatter={(value, name) => [
                    value == null ? "—" : `₹${formatNumber(value)}`,
                    name === "close" ? "Close" : name === "sma20" ? "SMA 20" : "SMA 50",
                  ]}
                />
                <Area type="monotone" dataKey="close" stroke="#ef4444" strokeWidth={2} fill="url(#dashboardPriceFill)" isAnimationActive={false} />
                <Line type="monotone" dataKey="sma20" stroke="#ff9a9f" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
                <Line type="monotone" dataKey="sma50" stroke="#a65a60" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="dashboard-chart-note">Daily historical prices; moving averages are trend indicators, not future price targets.</p>
        </>
      ) : (
        <div className="dashboard-chart-empty">Historical chart data is unavailable for this stock.</div>
      )}
    </div>
  );
}

/* =========================================================
   METRIC
   ========================================================= */

function Metric({
  title,
  value,
  description,
  valueClass = "",
}) {
  return (
    <div className="card">

      <small>{title}</small>

      <h2 className={valueClass}>
        {value}
      </h2>

      <p>{description}</p>

    </div>
  );
}

/* =========================================================
   AI PREDICTION PAGE
   ========================================================= */

function Prediction({
  symbol,
  data,
  loading,
  loadingLstm,
  aiDecision,
  stocks,
  analyzeStock,
}) {
  if (!data) {
    return (
      <>
        <div className="page-intro">
          <span className="eyebrow">AI FORECAST LAB</span>
          <h2>AI Prediction</h2>
          <p>Compare LSTM and XGBoost with forecast graphs, confidence and model quality.</p>
        </div>
        <StockSelector stocks={stocks} analyzeStock={analyzeStock} loading={loading} />
      </>
    );
  }

  const xgb = data.prediction?.xgboost;
  const lstm = data.prediction?.lstm;
  const confidence = Number.isFinite(Number(xgb?.confidence)) ? Number(xgb.confidence) : null;

  return (
    <>
      <section className="prediction-hero">
        <div>
          <span className="eyebrow">AI FORECAST LAB • MODEL ACTIVE</span>
          <h2>{symbol}</h2>
          <p>Two-model prediction workspace with historical forecast comparison.</p>
        </div>
        <div className="prediction-decision-box">
          <span>AI DECISION</span>
          <strong className={aiDecision.status === "negative" ? "prediction-signal-down" : "prediction-signal-up"}>{aiDecision.decision}</strong>
          <small>{confidence != null ? `${confidence}% XGBoost confidence` : "Confidence unavailable"}</small>
        </div>
      </section>

      <section className="prediction-top-grid">
        <div className="prediction-model-card">
          <div className="prediction-model-head"><span className="model-badge">L</span><div><strong>LSTM</strong><small>Deep learning forecast</small></div><BrainCircuit size={19} /></div>
          <strong className="prediction-price">{lstm?.predicted_price != null ? `₹${formatNumber(lstm.predicted_price)}` : loadingLstm ? "Training..." : "—"}</strong>
          <span className={`prediction-change ${lstm?.expected_change < 0 ? "forecast-down" : "forecast-up"}`}>{lstm?.expected_change != null ? `${lstm.expected_change >= 0 ? "+" : ""}${lstm.expected_change}% expected` : "Waiting for model"}</span>
        </div>
        <div className="prediction-model-card xgboost-model-card">
          <div className="prediction-model-head"><span className="model-badge">X</span><div><strong>XGBoost</strong><small>Gradient boosting forecast</small></div><Gauge size={19} /></div>
          <div className="xgboost-model-content">
            <div
              className="xgboost-confidence-ring"
              role="img"
              aria-label={`XGBoost confidence: ${confidence == null ? "unavailable" : `${confidence.toFixed(1)} percent`}`}
              style={{ "--xgb-confidence": `${Math.min(100, Math.max(0, confidence ?? 0))}%` }}
            >
              <span>{confidence == null ? "—" : `${confidence.toFixed(0)}%`}</span>
              <small>CONFIDENCE</small>
            </div>
            <div className="xgboost-forecast">
              <small>Predicted price</small>
              <strong className="prediction-price">{xgb?.predicted_price != null ? `₹${formatNumber(xgb.predicted_price)}` : "—"}</strong>
              <span className={`prediction-change ${xgb?.expected_change < 0 ? "forecast-down" : "forecast-up"}`}>{xgb?.expected_change != null ? `${xgb.expected_change >= 0 ? "+" : ""}${xgb.expected_change}% expected` : "Waiting for model"}</span>
            </div>
          </div>
        </div>
      </section>

      <PredictionCharts xgb={xgb} lstm={lstm} />

      <section className="panel prediction-explain">
        <div className="panel-heading"><div><span className="eyebrow">MODEL EXPLANATION</span><h2>How the prediction is built</h2></div><Sparkles size={22} /></div>
        <div className="explain-grid">
          <div><span>01</span><strong>LSTM</strong><p>Reads sequential price patterns to model time-series behavior.</p></div>
          <div><span>02</span><strong>XGBoost</strong><p>Combines engineered market features and technical signals.</p></div>
          <div><span>03</span><strong>StockAI</strong><p>Places both model outputs beside technical and risk context.</p></div>
        </div>
      </section>
    </>
  );
}

/* =========================================================
   PREDICTION PANEL
   ========================================================= */

function PredictionPanel({ data, confidence, decision }) {
  const xgb = data.prediction?.xgboost;
  const lstm = data.prediction?.lstm;
  const predictedPrice = xgb?.predicted_price ?? lstm?.predicted_price;
  const expectedChange = xgb?.expected_change ?? lstm?.expected_change;

  return (
    <div className="panel analysis-insight-card prediction-insight-card">
      <div className="panel-heading">
        <div><span className="eyebrow">MACHINE LEARNING</span><h2>AI Prediction</h2></div>
        <BrainCircuit size={22} />
      </div>
      <div className="insight-score-area">
        <ScoreGauge label="AI confidence" value={confidence} color="#ef4444" detail={decision || "Awaiting signal"} />
        <div className="insight-primary-value">
          <small>Expected price</small>
          <strong>{predictedPrice != null ? `₹${formatNumber(predictedPrice)}` : "—"}</strong>
          <span className={expectedChange > 0 ? "positive" : expectedChange < 0 ? "negative" : ""}>
            {expectedChange != null ? `${expectedChange > 0 ? "+" : ""}${expectedChange}% expected` : "Forecast unavailable"}
          </span>
        </div>
      </div>
      <div className="insight-detail-list">
        <div><span>LSTM forecast</span><strong>{lstm?.predicted_price != null ? `₹${formatNumber(lstm.predicted_price)}` : "—"}</strong></div>
        <div><span>XGBoost forecast</span><strong>{xgb?.predicted_price != null ? `₹${formatNumber(xgb.predicted_price)}` : "—"}</strong></div>
      </div>
      <p className="insight-footnote">Model estimates can be wrong; they are not guaranteed future prices.</p>
    </div>
  );
}

/* =========================================================
   TECHNICAL PANEL
   ========================================================= */

function TechnicalPanel({ data }) {
  const technical = data.technical || {};
  const score = technical.market_score;

  return (
    <div className="panel analysis-insight-card technical-insight-card">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">MARKET SIGNALS</span>
          <h2>Technical Analysis</h2>
        </div>
        <ChartNoAxesCombined size={22} />
      </div>
      <div className="insight-score-area">
        <ScoreGauge label="Technical score" value={score} color="#ff535d" detail={technical.overall_signal || "Signal unavailable"} unit="/100" />
        <div className="insight-primary-value">
          <small>Relative strength (RSI)</small>
          <strong>{technical.rsi?.value ?? "—"}</strong>
          <span>{technical.rsi?.signal || "RSI signal unavailable"}</span>
        </div>
      </div>
      <div className="insight-detail-list">
        <div><span>MACD trend</span><strong>{technical.macd?.trend ?? "—"}</strong></div>
        <div><span>SMA 20</span><strong>{technical.moving_average?.sma20 != null ? `₹${formatNumber(technical.moving_average.sma20)}` : "—"}</strong></div>
        <div><span>SMA 50</span><strong>{technical.moving_average?.sma50 != null ? `₹${formatNumber(technical.moving_average.sma50)}` : "—"}</strong></div>
      </div>
      <p className="insight-footnote">Technical indicators describe historical price behavior, not certain outcomes.</p>
    </div>
  );
}

/* =========================================================
   INDICATOR
   ========================================================= */

function Indicator({
  label,
  value,
  signal,
}) {
  return (
    <div className="indicator">

      <span>{label}</span>

      <strong>{value}</strong>

      {signal && (
        <em
          className={
            String(signal)
              .toLowerCase()
              .includes("bear")
              ? "red"
              : ""
          }
        >
          {signal}
        </em>
      )}

    </div>
  );
}

/* =========================================================
   RISK PANEL
   ========================================================= */

function RiskPanel({ data }) {
  const risk = data.risk || {};

  const parsedScore = Number(risk.risk_score);
  const scoreAvailable = risk.risk_score != null && Number.isFinite(parsedScore);
  const scoreTone = !scoreAvailable
    ? "moderate"
    : parsedScore >= 70
    ? "high"
    : parsedScore >= 45
    ? "moderate"
    : "low";

  return (
    <div className={`panel analysis-insight-card risk-panel risk-tone-${scoreTone}`}>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">RISK INTELLIGENCE</span>
          <h2>Risk Analysis</h2>
        </div>
        <ShieldAlert size={22} />
      </div>
      <div className="insight-score-area">
        <ScoreGauge
          label="Risk score"
          value={risk.risk_score}
          color="#ff535d"
          detail={risk.risk_level ? `${risk.risk_level} risk` : "Risk unavailable"}
          unit="/100"
        />
        <div className="insight-primary-value">
          <small>Risk level</small>
          <strong>{risk.risk_level ?? "—"}</strong>
          <span>{risk.volatility != null ? `${risk.volatility}% volatility` : "Volatility unavailable"}</span>
        </div>
      </div>
      <div className="insight-detail-list">
        <div><span>Beta</span><strong>{risk.beta ?? "—"}</strong></div>
        <div><span>Max drawdown</span><strong>{risk.max_drawdown != null ? `${risk.max_drawdown}%` : "—"}</strong></div>
        <div><span>Sharpe ratio</span><strong>{risk.sharpe_ratio ?? "—"}</strong></div>
        <div><span>Value at risk (95%)</span><strong>{risk.value_at_risk_95 != null ? `${risk.value_at_risk_95}%` : "—"}</strong></div>
      </div>
      <p className="insight-footnote">Risk score summarizes modeled historical risk; it does not predict or cap future losses.</p>
    </div>
  );
}

/* =========================================================
   MARKETS
   ========================================================= */

function Markets({ stocks, analyzeStock, loading }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const response = await axios.get(`${API}/api/market-search`, { params: { q }, timeout: 30000 });
      setResults(Array.isArray(response.data?.results) ? response.data.results : []);
    } catch (error) {
      console.error("Market search failed", error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <div className="page-intro market-page-intro">
        <span className="eyebrow">MARKET TERMINAL</span>
        <h2>Markets</h2>
        <p>Search any supported company, then launch the complete StockAI intelligence engine.</p>
      </div>

      <section className="market-search-panel">
        <div className="market-search-title"><SearchCheck size={19} /><div><span>SMART MARKET SEARCH</span><small>Yahoo Finance discovery</small></div></div>
        <div className="market-search-row">
          <Search size={19} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} placeholder="Search Reliance, Tesla, Apple, NVIDIA..." />
          <button onClick={runSearch} disabled={searching}>{searching ? "Searching..." : "Search"}</button>
        </div>
        {results.length > 0 && (
          <div className="market-search-results">
            {results.slice(0, 10).map((item) => (
              <button key={`${item.symbol}-${item.name}`} onClick={() => analyzeStock(item.symbol)} disabled={loading}>
                <span className="result-symbol">{String(item.symbol || "?").slice(0, 4)}</span>
                <span><strong>{item.name}</strong><small>{item.symbol} {item.exchange ? `• ${item.exchange}` : ""}</small></span>
                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="market-index-grid">
        <MarketIndexCard symbol="^NSEI" label="NIFTY 50" />
        <MarketIndexCard symbol="^BSESN" label="SENSEX" />
        <MarketIndexCard symbol="^NSEBANK" label="BANK NIFTY" />
        <MarketIndexCard symbol="^CNXIT" label="NIFTY IT" />
      </section>

      <section className="market-stocks-section">
        <div className="panel-heading"><div><span className="eyebrow">INDIAN EQUITIES</span><h2>Popular Stocks</h2></div><BarChart3 size={22} /></div>
        <StockSelector stocks={stocks} analyzeStock={analyzeStock} loading={loading} />
      </section>
    </>
  );
}

function MarketIndexCard({ symbol, label }) {
  const [state, setState] = useState({ loading: true, data: null });
  useEffect(() => {
    let alive = true;
    axios.get(`${API}/api/stocks/${encodeURIComponent(symbol)}`, { timeout: 30000 })
      .then((r) => alive && setState({ loading: false, data: r.data }))
      .catch(() => alive && setState({ loading: false, data: null }));
    return () => { alive = false; };
  }, [symbol]);
  const value = state.data?.price;
  const change = state.data?.change;
  return (
    <div className="market-index-card">
      <div><span className="index-live"></span><small>{label}</small></div>
      <strong>{state.loading ? "Loading" : value != null ? `₹${formatNumber(value)}` : "—"}</strong>
      <span className={change >= 0 ? "red-text" : "muted-text"}>{change != null ? `${change >= 0 ? "+" : ""}${change}%` : "Data unavailable"}</span>
    </div>
  );
}

/* =========================================================
   MODERN ANALYTICS CHARTS
   ========================================================= */

const chartGrid = {
  stroke: "rgba(255,255,255,0.07)",
  strokeDasharray: "2 6",
};

const axisStyle = {
  fill: "rgba(255,255,255,0.42)",
  fontSize: 11,
};

function ModernTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        minWidth: 180,
        padding: "12px 14px",
        borderRadius: 14,
        background: "rgba(12,12,20,0.96)",
        border: "1px solid rgba(168,85,247,0.28)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.48)",
          fontSize: 11,
          marginBottom: 8,
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>

      {payload.map((item, index) => (
        <div
          key={`${item.dataKey}-${index}`}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            marginTop: 6,
            fontSize: 12,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.68)" }}>
            {item.name}
          </span>
          <strong style={{ color: "#fff" }}>
            {typeof item.value === "number"
              ? item.value.toFixed(2)
              : item.value ?? "—"}
          </strong>
        </div>
      ))}
    </div>
  );
}

function ChartHeader({ eyebrow = "LIVE ANALYTICS", title, subtitle, right }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 20,
        marginBottom: 18,
      }}
    >
      <div>
        <div
          style={{
            color: "#ef4444",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            marginBottom: 7,
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 750,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              margin: "6px 0 0",
              color: "rgba(255,255,255,0.46)",
              fontSize: 12,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {right && <div>{right}</div>}
    </div>
  );
}

function MiniStat({ label, value, tone = "purple" }) {
  const tones = {
    purple: "#ef4444",
    green: "#62d89a",
    blue: "#e6c96b",
    orange: "#e6c96b",
    red: "#ef4444",
  };

  return (
    <div
      style={{
        padding: "9px 12px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.07)",
        minWidth: 90,
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.42)",
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: tones[tone] || tones.purple,
          fontWeight: 750,
          fontSize: 15,
          marginTop: 3,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ModernChartCard({ children, title, subtitle, stats, eyebrow, className = "" }) {
  return (
    <div className={`modern-chart-card ${className}`.trim()}>
      <ChartHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        right={
          stats?.length ? (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              {stats.map((stat) => (
                <MiniStat key={stat.label} {...stat} />
              ))}
            </div>
          ) : null
        }
      />

      <div style={{ width: "100%", height: 330 }}>{children}</div>
    </div>
  );
}

function TechnicalCharts({ technical }) {
  const h = Array.isArray(technical?.history)
    ? technical.history
    : [];

  const latest = h[h.length - 1] || {};
  const price = Number(technical?.price ?? latest.close ?? 0);
  const rsi = Number(technical?.rsi?.value ?? latest.rsi ?? 0);
  const volatility = Number(
    technical?.volatility ?? latest.volatility ?? 0
  );

  if (!h.length) {
    return (
      <ModernChartCard
        title="Technical Intelligence"
        subtitle="Historical indicator data is unavailable for this symbol."
      >
        <div className="indicator">
          <span>Chart data</span>
          <strong>Unavailable</strong>
        </div>
      </ModernChartCard>
    );
  }

  return (
    <>
      <ModernChartCard
        eyebrow="PRICE ENGINE"
        title="Price Intelligence"
        subtitle="Price action with trend structure and moving averages"
        stats={[
          { label: "Price", value: price ? `₹${price.toFixed(2)}` : "—", tone: "blue" },
          { label: "RSI", value: rsi ? rsi.toFixed(1) : "—", tone: rsi > 70 ? "red" : rsi < 30 ? "green" : "purple" },
          { label: "Volatility", value: volatility ? `${volatility.toFixed(1)}%` : "—", tone: "orange" },
        ]}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={h} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="priceGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...chartGrid} vertical={false} />
            <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} minTickGap={32} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={54} domain={["auto", "auto"]} />
            <Tooltip content={<ModernTooltip />} cursor={{ stroke: "rgba(168,85,247,0.35)" }} />
            <Line type="monotone" dataKey="close" name="Price" stroke="#fff" strokeWidth={2.2} dot={false} activeDot={{ r: 5, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }} />
            <Line type="monotone" dataKey="ema20" name="EMA 20" stroke="#ffffff" strokeWidth={1.8} dot={false} />
            <Line type="monotone" dataKey="sma20" name="SMA 20" stroke="#ef4444" strokeWidth={1.8} dot={false} />
            <Line type="monotone" dataKey="sma50" name="SMA 50" stroke="#ef4444" strokeWidth={1.8} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ModernChartCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 }}>
        <ModernChartCard
          eyebrow="MOMENTUM"
          title="RSI Regime"
          subtitle="Momentum strength with overbought / oversold zones"
          stats={[
            { label: "Current RSI", value: rsi ? rsi.toFixed(2) : "—", tone: rsi > 70 ? "red" : rsi < 30 ? "green" : "purple" },
          ]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={h} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="rsiFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartGrid} vertical={false} />
              <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} minTickGap={35} />
              <YAxis domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} width={34} />
              <Tooltip content={<ModernTooltip />} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 5" strokeOpacity={0.7} />
              <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="4 5" strokeOpacity={0.7} />
              <Area type="monotone" dataKey="rsi" name="RSI" stroke="#ef4444" strokeWidth={2} fill="url(#rsiFill)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ModernChartCard>

        <ModernChartCard
          eyebrow="TREND MOMENTUM"
          title="MACD Signal Flow"
          subtitle="MACD momentum against the signal line"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={h} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid {...chartGrid} vertical={false} />
              <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} minTickGap={35} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<ModernTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
              <Line type="monotone" dataKey="macd" name="MACD" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="macd_signal" name="Signal" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ModernChartCard>
      </div>

      <ModernChartCard
        eyebrow="VOLATILITY STRUCTURE"
        title="Bollinger Price Envelope"
        subtitle="Price position inside the dynamic volatility channel"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={h} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...chartGrid} vertical={false} />
            <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} minTickGap={32} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={54} domain={["auto", "auto"]} />
            <Tooltip content={<ModernTooltip />} />
            <Area type="monotone" dataKey="bb_upper" name="Upper Band" stroke="rgba(168,85,247,0.75)" fill="url(#bandFill)" dot={false} strokeWidth={1.5} />
            <Area type="monotone" dataKey="bb_lower" name="Lower Band" stroke="rgba(34,197,94,0.75)" fill="transparent" dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="close" name="Price" stroke="#fff" strokeWidth={2.2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ModernChartCard>
    </>
  );
}

function RiskCharts({ risk }) {
  const h = Array.isArray(risk?.history) ? risk.history : [];
  const score = Number(risk?.risk_score || 0);
  const riskColor = score >= 70 ? "#ef4444" : score >= 40 ? "#ef4444" : "#ef4444";

  const factors = [
    { name: "Volatility", value: Number(risk?.volatility || 0) },
    { name: "Beta", value: Number(risk?.beta || 0) },
    { name: "Drawdown", value: Math.abs(Number(risk?.max_drawdown || 0)) },
    { name: "VaR 95", value: Math.abs(Number(risk?.value_at_risk_95 || 0)) },
  ];

  return (
    <>
      <ModernChartCard
        eyebrow="RISK ENGINE"
        title="Portfolio Risk Profile"
        subtitle="Composite risk score and key risk statistics"
        stats={[
          { label: "Score", value: score.toFixed(0), tone: score >= 70 ? "red" : score >= 40 ? "orange" : "green" },
          { label: "Level", value: risk?.risk_level || "—", tone: score >= 70 ? "red" : "orange" },
          { label: "Beta", value: risk?.beta != null ? Number(risk.beta).toFixed(2) : "—", tone: "blue" },
        ]}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[{ name: "Composite Risk", score }]} margin={{ top: 18, right: 18, left: 0, bottom: 10 }} barCategoryGap="45%">
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <CartesianGrid {...chartGrid} vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip content={<ModernTooltip />} />
            <Bar dataKey="score" name="Risk Score" fill="url(#riskGradient)" radius={[10, 10, 0, 0]} barSize={120} />
          </BarChart>
        </ResponsiveContainer>
      </ModernChartCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 }}>
        <ModernChartCard
          eyebrow="RISK FACTORS"
          title="Factor Matrix"
          subtitle="Relative magnitude of the current risk indicators"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={factors} margin={{ top: 12, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid {...chartGrid} vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Bar dataKey="value" name="Value" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ModernChartCard>

        <ModernChartCard
          eyebrow="RISK SNAPSHOT"
          title="Risk Metrics"
          subtitle="Live statistics returned by the risk engine"
          stats={[
            { label: "Volatility", value: risk?.volatility != null ? `${Number(risk.volatility).toFixed(2)}%` : "—", tone: "orange" },
            { label: "Drawdown", value: risk?.max_drawdown != null ? `${Number(risk.max_drawdown).toFixed(2)}%` : "—", tone: "red" },
            { label: "Sharpe", value: risk?.sharpe_ratio != null ? Number(risk.sharpe_ratio).toFixed(2) : "—", tone: "blue" },
            { label: "VaR 95", value: risk?.value_at_risk_95 != null ? `${Number(risk.value_at_risk_95).toFixed(2)}%` : "—", tone: "purple" },
          ]}
        >
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 190,
                height: 190,
                borderRadius: "50%",
                background: `conic-gradient(${riskColor} ${Math.min(score, 100)}%, rgba(255,255,255,0.06) 0)`,
                display: "grid",
                placeItems: "center",
                boxShadow: `0 0 55px ${riskColor}25`,
              }}
            >
              <div
                style={{
                  width: 148,
                  height: 148,
                  borderRadius: "50%",
                  background: "#0b0b12",
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>
                    {score.toFixed(0)}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", textTransform: "uppercase", letterSpacing: "0.16em" }}>
                    Risk Score
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModernChartCard>
      </div>

      {h.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 }}>
          <ModernChartCard
            eyebrow="RISK TIMELINE"
            title="Volatility Regime"
            subtitle="How market volatility evolved over time"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={h} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...chartGrid} vertical={false} />
                <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} minTickGap={35} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<ModernTooltip />} />
                <Area type="monotone" dataKey="volatility" name="Volatility %" stroke="#ef4444" strokeWidth={2} fill="url(#volFill)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ModernChartCard>

          <ModernChartCard
            eyebrow="DRAWDOWN MONITOR"
            title="Capital Drawdown"
            subtitle="Distance from the historical running peak"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={h} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="drawFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...chartGrid} vertical={false} />
                <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} minTickGap={35} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<ModernTooltip />} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.18)" />
                <Area type="monotone" dataKey="drawdown" name="Drawdown %" stroke="#ef4444" strokeWidth={2} fill="url(#drawFill)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ModernChartCard>
        </div>
      )}
    </>
  );
}

function PredictionCharts({ xgb, lstm }) {
  const x = Array.isArray(xgb?.history) ? xgb.history : [];
  const l = Array.isArray(lstm?.history) ? lstm.history : [];
  const n = Math.max(x.length, l.length);

  const h = Array.from({ length: n }, (_, i) => ({
    date: x[i]?.date || l[i]?.date || String(i + 1),
    actual: x[i]?.actual ?? l[i]?.actual ?? null,
    xgb: x[i]?.predicted ?? null,
    lstm: l[i]?.predicted ?? null,
  }));

  const models = [
    ...(xgb
      ? [{
          model: "XGBoost",
          mae: Number(xgb.mae || 0),
          change: Number(xgb.expected_change || 0),
          confidence: Number(xgb.confidence || 0),
        }]
      : []),
    ...(lstm
      ? [{
          model: "LSTM",
          mae: Number(lstm.mae || 0),
          change: Number(lstm.expected_change || 0),
          confidence: null,
        }]
      : []),
  ];

  const xgbConfidence = xgb?.confidence != null && Number.isFinite(Number(xgb.confidence))
    ? Number(xgb.confidence)
    : null;

  return (
    <>
      <ModernChartCard
        eyebrow="AI FORECAST ENGINE"
        title="Prediction Intelligence"
        subtitle="Actual market behavior compared with the two AI model forecasts"
        stats={[
          { label: "XGBoost", value: xgb?.predicted_price != null ? `₹${Number(xgb.predicted_price).toFixed(2)}` : "—", tone: "green" },
          { label: "LSTM", value: lstm?.predicted_price != null ? `₹${Number(lstm.predicted_price).toFixed(2)}` : "—", tone: "purple" },
          { label: "Confidence", value: xgbConfidence ? `${xgbConfidence.toFixed(1)}%` : "—", tone: "blue" },
        ]}
      >
        {h.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={h} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="aiActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartGrid} vertical={false} />
              <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} minTickGap={35} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={54} domain={["auto", "auto"]} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="#fff" strokeWidth={2.2} dot={false} activeDot={{ r: 5, fill: "#fff", stroke: "#ef4444", strokeWidth: 2 }} />
              <Line type="monotone" dataKey="xgb" name="XGBoost" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="lstm" name="LSTM" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="indicator"><span>Prediction history</span><strong>Unavailable</strong></div>
        )}
      </ModernChartCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 }}>
        <ModernChartCard
          eyebrow="MODEL OUTPUT"
          title="Expected Change"
          subtitle="Estimated next-price movement from each model"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={models} margin={{ top: 10, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid {...chartGrid} vertical={false} />
              <XAxis dataKey="model" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
              <Bar dataKey="change" name="Expected Change %" radius={[9, 9, 0, 0]}>
                {models.map((model) => (
                  <Cell key={model.model} fill={model.change >= 0 ? "#ef4444" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ModernChartCard>

        <ModernChartCard
          eyebrow="MODEL QUALITY"
          title="Error Comparison"
          subtitle="Lower MAE means smaller average prediction error"
          stats={models.map((m) => ({ label: m.model, value: m.mae.toFixed(2), tone: m.model === "XGBoost" ? "green" : "purple" }))}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={models} margin={{ top: 10, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid {...chartGrid} vertical={false} />
              <XAxis dataKey="model" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Bar dataKey="mae" name="MAE" fill="#ef4444" radius={[9, 9, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ModernChartCard>
      </div>

      <ModernChartCard
        eyebrow="MODEL CONFIDENCE"
        title="XGBoost Confidence"
        subtitle="Backend confidence estimate for the current prediction"
        stats={[{ label: "Confidence", value: xgbConfidence != null ? `${xgbConfidence.toFixed(1)}%` : "—", tone: "red" }]}
        className="xgb-confidence-chart-card"
      >
        <div className="xgb-confidence-visual">
          <div
            className="xgb-confidence-gauge"
            role="img"
            aria-label={`XGBoost confidence: ${xgbConfidence != null ? `${xgbConfidence.toFixed(1)} percent` : "unavailable"}`}
            style={{
              "--confidence-fill": `${Math.min(100, Math.max(0, xgbConfidence ?? 0))}%`,
            }}
          >
            <div className="xgb-confidence-gauge-center">
              <strong>{xgbConfidence != null ? `${xgbConfidence.toFixed(1)}%` : "—"}</strong>
              <span>MODEL CONFIDENCE</span>
            </div>
          </div>
        </div>
      </ModernChartCard>
    </>
  );
}

/* =========================================================
   TECHNICAL PAGE
   ========================================================= */

function Technical({
  symbol,
  data,
  stocks,
  analyzeStock,
  loading,
}) {
  if (!data?.technical) {
    return (
      <>
        <div className="page-intro">
          <span className="eyebrow">TECHNICAL ENGINE</span>
          <h2>Technical Analysis</h2>
          <p>Select a stock to load technical indicators and graphs.</p>
        </div>

        <StockSelector
          stocks={stocks}
          analyzeStock={analyzeStock}
          loading={loading}
        />
      </>
    );
  }

  const technical = data.technical;

  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">TECHNICAL ENGINE</span>
        <h2>Technical Analysis</h2>
        <p>{symbol} technical market intelligence with trend and momentum graphs.</p>
      </div>

      <div className="cards">
        <Metric
          title="Market Score"
          value={technical.market_score ?? "—"}
          description="Technical strength score"
        />
        <Metric
          title="Overall Signal"
          value={technical.overall_signal ?? "—"}
          description="Combined technical signal"
        />
        <Metric
          title="RSI"
          value={technical.rsi?.value ?? "—"}
          description={technical.rsi?.signal ?? "RSI signal"}
        />
        <Metric
          title="Volatility"
          value={
            technical.volatility != null
              ? `${technical.volatility}%`
              : "—"
          }
          description="Market volatility"
        />
      </div>

      <div className="analysis-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">MOMENTUM</span>
              <h2>Indicators</h2>
            </div>
            <Activity size={22} />
          </div>

          <Indicator
            label="RSI"
            value={technical.rsi?.value ?? "—"}
            signal={technical.rsi?.signal ?? "—"}
          />
          <Indicator
            label="MACD"
            value={technical.macd?.value ?? "—"}
            signal={technical.macd?.trend ?? "—"}
          />
          <Indicator
            label="MACD Signal"
            value={technical.macd?.signal ?? "—"}
          />
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">MOVING AVERAGES</span>
              <h2>Trend Analysis</h2>
            </div>
            <TrendingUp size={22} />
          </div>

          <Indicator
            label="SMA 20"
            value={
              technical.moving_average?.sma20
                ? `₹${formatNumber(technical.moving_average.sma20)}`
                : "—"
            }
          />
          <Indicator
            label="SMA 50"
            value={
              technical.moving_average?.sma50
                ? `₹${formatNumber(technical.moving_average.sma50)}`
                : "—"
            }
          />
          <Indicator
            label="EMA 20"
            value={
              technical.moving_average?.ema20
                ? `₹${formatNumber(technical.moving_average.ema20)}`
                : "—"
            }
          />
          <Indicator
            label="Trend"
            value={technical.moving_average?.trend ?? "—"}
          />
        </div>
      </div>

      <TechnicalCharts technical={technical} />

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">EXPLANATION</span>
            <h2>How to Read Technical Analysis</h2>
          </div>
          <ChartNoAxesCombined size={22} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <div className="indicator">
            <span>RSI</span>
            <strong>Momentum</strong>
            <em>Shows whether recent price momentum is relatively strong or weak.</em>
          </div>
          <div className="indicator">
            <span>MACD</span>
            <strong>Trend momentum</strong>
            <em>Compares moving-average momentum with its signal line.</em>
          </div>
          <div className="indicator">
            <span>SMA / EMA</span>
            <strong>Trend direction</strong>
            <em>Smoothing helps reveal the underlying price trend.</em>
          </div>
          <div className="indicator">
            <span>Bollinger Bands</span>
            <strong>Price dispersion</strong>
            <em>Shows the current price relative to a moving range.</em>
          </div>
          <div className="indicator">
            <span>Volatility</span>
            <strong>Movement intensity</strong>
            <em>Higher volatility means larger historical price variation.</em>
          </div>
        </div>
      </div>
    </>
  );
}
/* =========================================================
   RISK PAGE
   ========================================================= */

function Risk({
  symbol,
  data,
  stocks,
  analyzeStock,
  loading,
}) {
  if (!data?.risk) {
    return (
      <>
        <div className="page-intro">
          <span className="eyebrow">RISK ENGINE</span>
          <h2>Risk Analysis</h2>
          <p>Select a stock to calculate risk metrics and graphs.</p>
        </div>

        <StockSelector
          stocks={stocks}
          analyzeStock={analyzeStock}
          loading={loading}
        />
      </>
    );
  }

  const risk = data.risk;

  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">RISK ENGINE</span>
        <h2>Risk Analysis</h2>
        <p>Risk intelligence for {symbol}, including score, downside, volatility and risk-adjusted performance.</p>
      </div>

      <div className="cards">
        <Metric
          title="Risk Score"
          value={risk.risk_score != null ? `${risk.risk_score}/100` : "—"}
          description="Calculated risk score"
        />
        <Metric
          title="Risk Level"
          value={risk.risk_level ?? "—"}
          description="Overall risk classification"
        />
        <Metric
          title="Volatility"
          value={risk.volatility != null ? `${risk.volatility}%` : "—"}
          description="Historical volatility"
        />
        <Metric
          title="Beta"
          value={risk.beta ?? "—"}
          description={risk.beta_status ?? "Market sensitivity"}
        />
      </div>

      <RiskPanel data={data} />

      <div className="analysis-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">DOWNSIDE</span>
              <h2>Drawdown</h2>
            </div>
            <TrendingDown size={22} />
          </div>

          <Indicator
            label="Maximum Drawdown"
            value={
              risk.max_drawdown != null
                ? `${risk.max_drawdown}%`
                : "—"
            }
          />

          <Indicator
            label="Value at Risk 95%"
            value={
              risk.value_at_risk_95 != null
                ? `${risk.value_at_risk_95}%`
                : "—"
            }
          />
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">RISK ADJUSTED</span>
              <h2>Performance</h2>
            </div>
            <Activity size={22} />
          </div>

          <Indicator
            label="Sharpe Ratio"
            value={risk.sharpe_ratio ?? "—"}
          />

          <Indicator
            label="Assessment"
            value={risk.sharpe_status ?? "—"}
          />

          <Indicator
            label="Beta Status"
            value={risk.beta_status ?? "—"}
          />
        </div>
      </div>

      <RiskCharts risk={risk} />

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">EXPLANATION</span>
            <h2>How to Read Risk Analysis</h2>
          </div>
          <ShieldAlert size={22} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <div className="indicator">
            <span>Risk Score</span>
            <strong>0–100 composite</strong>
            <em>Combines several risk measures used by the backend.</em>
          </div>
          <div className="indicator">
            <span>Volatility</span>
            <strong>Price movement</strong>
            <em>Higher values indicate greater historical price variation.</em>
          </div>
          <div className="indicator">
            <span>Beta</span>
            <strong>Market sensitivity</strong>
            <em>Measures how stock returns move relative to the benchmark.</em>
          </div>
          <div className="indicator">
            <span>Drawdown</span>
            <strong>Peak-to-trough loss</strong>
            <em>Shows the depth of historical declines from running peaks.</em>
          </div>
          <div className="indicator">
            <span>VaR 95%</span>
            <strong>Downside estimate</strong>
            <em>Uses the historical 5th-percentile daily return.</em>
          </div>
          <div className="indicator">
            <span>Sharpe Ratio</span>
            <strong>Risk-adjusted return</strong>
            <em>Compares excess return with annualized volatility.</em>
          </div>
        </div>
      </div>
    </>
  );
}
/* =========================================================
   PORTFOLIO
   ========================================================= */

function Portfolio({
  portfolio,
  onAdd,
  onRemove,
  onShare,
  onRevokeShare,
  shareUrl,
  shareStatus,
}) {
  const totalInvested = portfolio.reduce((sum, stock) => {
    const buyPrice = Number(stock.buyPrice ?? stock.buy_price ?? 0);
    const quantity = Number(stock.quantity ?? 0);
    return sum + buyPrice * quantity;
  }, 0);

  const totalHoldings = portfolio.length;
  const totalShares = portfolio.reduce((sum, stock) => sum + Number(stock.quantity ?? 0), 0);
  const averageEntry = totalShares ? totalInvested / totalShares : 0;

  const portfolioSummary = [
    { label: "Total invested", value: `₹${formatNumber(totalInvested)}` },
    { label: "Holdings", value: `${totalHoldings}` },
    { label: "Avg. cost / share", value: `₹${formatNumber(averageEntry)}` },
    { label: "Total shares", value: formatNumber(totalShares) },
  ];

  return (
    <>
      <div className="page-intro">

        <span className="eyebrow">
          PORTFOLIO MANAGEMENT
        </span>

        <h2>Portfolio Intelligence</h2>

        <p>
          Track your selected stocks and portfolio allocation with a cleaner, more active view.
        </p>

      </div>

      <section className="portfolio-summary-grid">
        {portfolioSummary.map((item) => (
          <div key={item.label} className="portfolio-summary-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>

      <div className="portfolio-actions">

        <button
          className="primary-button"
          onClick={onAdd}
        >
          <Plus
            size={17}
            style={{
              verticalAlign: "middle",
              marginRight: 6,
            }}
          />
          Add Stock
        </button>

        <button className="secondary-button" onClick={onShare}>
          Share read-only portfolio
        </button>
        <button className="secondary-button" onClick={onRevokeShare}>
          Revoke share links
        </button>
      </div>

      {(shareStatus || shareUrl) && (
        <section className="portfolio-share-panel" aria-live="polite">
          {shareStatus && <p>{shareStatus}</p>}
          {shareUrl && (
            <input
              aria-label="Read-only portfolio share link"
              value={shareUrl}
              readOnly
              onFocus={(event) => event.target.select()}
            />
          )}
        </section>
      )}

      {portfolio.length === 0 ? (
        <div className="portfolio-empty">

          <div className="portfolio-icon">
            <BriefcaseBusiness size={38} />
          </div>

          <h2>Build Your Portfolio</h2>

          <p>
            Add multiple stocks and calculate portfolio allocation, expected return and risk.
          </p>

          <button
            className="primary-button"
            onClick={onAdd}
          >
            <Plus
              size={17}
              style={{
                verticalAlign: "middle",
                marginRight: 6,
              }}
            />
            Add Stock
          </button>

        </div>
      ) : (
        <div className="portfolio-list">

          {portfolio.map((stock, index) => {
            const invested = Number(stock.quantity ?? 0) * Number(stock.buyPrice ?? stock.buy_price ?? 0);
            const allocation = totalInvested ? (invested / totalInvested) * 100 : 0;
            const badgeTone = index % 2 === 0 ? "positive" : "neutral";

            return (
              <div className="portfolio-stock" key={`${stock.symbol}-${index}`}>
                <div className="portfolio-stock-head">
                  <span className={`portfolio-stock-badge ${badgeTone}`}>{stock.short || (stock.symbol || "ST").slice(0, 2).toUpperCase()}</span>
                  <div>
                    <strong>{stock.name}</strong>
                    <span>{stock.symbol}</span>
                  </div>
                </div>

                <div>
                  <span>QUANTITY</span>
                  <strong>{stock.quantity}</strong>
                </div>

                <div>
                  <span>BUY PRICE</span>
                  <strong>₹{formatNumber(stock.buyPrice ?? stock.buy_price)}</strong>
                </div>

                <div>
                  <span>INVESTED</span>
                  <strong>₹{formatNumber(invested)}</strong>
                </div>

                <div>
                  <span>ALLOCATION</span>
                  <div className="portfolio-progress-wrap">
                    <div className="portfolio-progress" style={{ width: `${Math.min(allocation, 100)}%` }} />
                  </div>
                  <strong className="portfolio-allocation">{allocation.toFixed(1)}%</strong>
                </div>

                <div>
                  <span>STATUS</span>
                  <strong className="green">TRACKING</strong>
                </div>

                <button onClick={() => onRemove(stock.symbol || index)}>Remove</button>
              </div>
            );
          })}

        </div>
      )}
    </>
  );
}

function SharedPortfolioView({ portfolio }) {
  const totalInvested = portfolio.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.buy_price || 0),
    0
  );

  return (
    <main className="login-screen">
      <section className="portfolio-share-panel">
        <span className="eyebrow">READ-ONLY PORTFOLIO</span>
        <h1>Shared holdings</h1>
        <p>This is a snapshot of holdings shared by a StockAI user. It is not investment advice.</p>
        <strong>Total shown: ₹{formatNumber(totalInvested)}</strong>
        {portfolio.length === 0 ? (
          <p>No holdings are currently shared.</p>
        ) : (
          <div className="portfolio-list">
            {portfolio.map((item) => (
              <article className="portfolio-stock" key={item.symbol}>
                <div className="portfolio-stock-head">
                  <span className="portfolio-stock-badge neutral">{item.short || item.symbol.slice(0, 2)}</span>
                  <div><strong>{item.name}</strong><span>{item.symbol}</span></div>
                </div>
                <div><span>QUANTITY</span><strong>{item.quantity}</strong></div>
                <div><span>BUY PRICE</span><strong>₹{formatNumber(item.buy_price)}</strong></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/* =========================================================
   NUMBER FORMAT
   ========================================================= */

function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return value;
  }

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

export default App;