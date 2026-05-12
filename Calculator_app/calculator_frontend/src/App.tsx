import React, { useState } from 'react';
import './App.css';
import { useAuthStore } from './store/authStore';
import { masterLogin, masterSignup } from './api/auth';

const MAX_OPERATIONS = 5;

const App: React.FC = () => {
  const { isAuthenticated, user, setAuth, clearAuth } = useAuthStore();
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [opCount, setOpCount] = useState(0);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [history, setHistory] = useState<string[]>([]);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleNumber = (num: string) => {
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = async () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }

    if (opCount >= MAX_OPERATIONS) {
      setShowSubscription(true);
      return;
    }

    try {
      const fullEquation = equation + display;
      // Using eval for demo purposes in a calculator MVP
      // In a real app, we would use a math parser
      const result = eval(fullEquation);
      
      setHistory([fullEquation + ' = ' + result, ...history].slice(0, 5));
      setDisplay(result.toString());
      setEquation('');
      setOpCount(prev => prev + 1);
    } catch (error) {
      setDisplay('Error');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');
    try {
      if (isLoginView) {
        const response = await masterLogin({ email, password });
        setAuth(response.appAccessToken, response.refreshToken, response.user);
      } else {
        await masterSignup({ username, email, password });
        const response = await masterLogin({ email, password });
        setAuth(response.appAccessToken, response.refreshToken, response.user);
      }
      setShowLogin(false);
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  return (
    <div className="app-container">
      <header className="app-header animate-fade-in">
        <div className="universal-brand">
          <span className="logo-dot"></span>
          <span className="brand-text">Universal Calculator</span>
        </div>

        {isAuthenticated ? (
          <div className="user-profile">
            <span className="user-name">Hi, {user?.username}</span>
            <button className="btn-logout" onClick={clearAuth}>Logout</button>
          </div>
        ) : (
          <button className="btn-login-trigger" onClick={() => setShowLogin(true)}>Login</button>
        )}
      </header>

      <div className="main-layout">
        <div className="calculator-stack">
          <div className="calculator-card glass animate-fade-in">
            <div className="display-section">
              <div className="equation">{equation}</div>
              <div className="current-display">{display}</div>
            </div>

            <div className="buttons-grid">
              <button onClick={clear} className="btn-func">AC</button>
              <button onClick={() => handleOperator('/')} className="btn-op">/</button>
              <button onClick={() => handleOperator('*')} className="btn-op">×</button>
              <button onClick={() => setDisplay(display.slice(0, -1) || '0')} className="btn-op">⌫</button>

              <button onClick={() => handleNumber('7')}>7</button>
              <button onClick={() => handleNumber('8')}>8</button>
              <button onClick={() => handleNumber('9')}>9</button>
              <button onClick={() => handleOperator('-')} className="btn-op">−</button>

              <button onClick={() => handleNumber('4')}>4</button>
              <button onClick={() => handleNumber('5')}>5</button>
              <button onClick={() => handleNumber('6')}>6</button>
              <button onClick={() => handleOperator('+')} className="btn-op">+</button>

              <button onClick={() => handleNumber('1')}>1</button>
              <button onClick={() => handleNumber('2')}>2</button>
              <button onClick={() => handleNumber('3')}>3</button>
              <button onClick={calculate} className="btn-equal">=</button>

              <button onClick={() => handleNumber('0')} className="btn-zero">0</button>
              <button onClick={() => handleNumber('.')}>.</button>
            </div>
          </div>

          <div className="usage-indicator animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(opCount / MAX_OPERATIONS) * 100}%` }}
              ></div>
            </div>
            <span>Free Tier: {opCount}/{MAX_OPERATIONS} Operations</span>
          </div>
        </div>

        <div className="history-drawer animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h4>Recent Activity</h4>
          {history.length === 0 ? (
            <p className="empty-msg">No recent operations</p>
          ) : (
            <ul>
              {history.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          )}
        </div>
      </div>

      {showLogin && (
        <div className="modal-overlay">
          <div className="auth-modal glass animate-scale-up">
            <div className="modal-header">
              <h3>{isLoginView ? 'Welcome Back' : 'Create Account'}</h3>
              <p>{isLoginView ? 'Login to continue calculating' : 'Join Universal for more features'}</p>
            </div>

            <form onSubmit={handleAuth} className="auth-form">
              {!isLoginView && (
                <div className="input-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="Enter username"
                    required 
                  />
                </div>
              )}
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@company.com"
                  required 
                />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required 
                />
              </div>

              {authError && <div className="error-message">{authError}</div>}

              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                {isLoginView ? "Don't have an account? " : "Already have an account? "}
                <span onClick={() => setIsLoginView(!isLoginView)}>
                  {isLoginView ? 'Sign Up' : 'Sign In'}
                </span>
              </p>
              <button className="btn-close" onClick={() => setShowLogin(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showSubscription && (
        <div className="modal-overlay">
          <div className="subscription-modal glass animate-fade-in">
            <div className="modal-header">
              <h3>Upgrade to Pro</h3>
              <p>You've reached the limit of free operations.</p>
            </div>
            
            <div className="pricing-plans">
              <div className="plan pro">
                <div className="plan-badge">Most Popular</div>
                <h4>Universal Pro</h4>
                <div className="price">$9.99<span>/mo</span></div>
                <ul>
                  <li>✓ Unlimited Operations</li>
                  <li>✓ Advanced Scientific Mode</li>
                  <li>✓ Sync across Universal Admin</li>
                  <li>✓ 24/7 Priority Support</li>
                </ul>
                <button className="btn-primary" onClick={() => alert('Redirecting to Checkout...')}>
                  Get Pro Now
                </button>
              </div>
            </div>
            
            <button className="btn-close" onClick={() => setShowSubscription(false)}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

