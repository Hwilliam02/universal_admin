import React, { useEffect, useState } from 'react';
import './App.css';
import { useAuthStore } from './store/authStore';
import { masterLogin, masterSignup, refreshAppToken, verifyCode } from './api/auth';
import type { AuthResult, VerificationRequiredResponse } from './api/auth';
import { compute, getHistory, getSubscriptionInfo } from './api/calculator';
import { createCheckoutSession } from './api/subscription';

const MAX_OPERATIONS = 5;

const App: React.FC = () => {
  const { isAuthenticated, user, setAuth, clearAuth } = useAuthStore();
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [opCount, setOpCount] = useState(0);
  const [operationLimit, setOperationLimit] = useState(MAX_OPERATIONS);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [calcError, setCalcError] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isVerificationView, setIsVerificationView] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const isVerificationRequired = (
    response: AuthResult
  ): response is VerificationRequiredResponse =>
    'status' in response && response.status === 'verification_required';

  const handleNumber = (num: string) => {
    setCalcError('');
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setCalcError('');
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  useEffect(() => {
    // Handle Stripe redirect params
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscribed') === 'true') {
      setNotification({ type: 'success', message: 'Welcome to Pro! Your subscription is now active.' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('cancelled') === 'true') {
      setNotification({ type: 'error', message: 'Subscription cancelled. You can try again later.' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isActive = true;

    const loadCalculatorState = async () => {
      try {
        const [historyData, subscription] = await Promise.all([
          getHistory(),
          getSubscriptionInfo(),
        ]);

        if (!isActive) return;

        setHistory(
          historyData.map((item) => `${item.equation} = ${item.result}`)
        );
        setOpCount(subscription.op_count ?? 0);
        setOperationLimit(subscription.limit ?? MAX_OPERATIONS);
        setIsPro(!!subscription.isPro);
      } catch {
        if (!isActive) return;
        setHistory([]);
      }
    };

    void loadCalculatorState();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    clearAuth();
    setDisplay('0');
    setEquation('');
    setHistory([]);
    setOpCount(0);
    setOperationLimit(MAX_OPERATIONS);
    setCalcError('');
  };

  const calculate = async () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }

    if (opCount >= operationLimit) {
      setShowSubscription(true);
      return;
    }

    try {
      const fullEquation = `${equation}${display}`.trim();
      if (!fullEquation || /[+\-*/]$/.test(fullEquation)) {
        setCalcError('Please enter a complete equation before calculating.');
        return;
      }

      const response = await compute(fullEquation);

      setCalcError('');
      setHistory((currentHistory) => [
        `${response.equation} = ${response.result}`,
        ...currentHistory,
      ].slice(0, 2));
      setDisplay(response.result);
      setEquation('');
      setOpCount(response.op_count);
      setOperationLimit(response.limit);
    } catch (error) {
      const apiError = error as { response?: { status?: number; data?: { error?: string } } };
      const message = apiError?.response?.data?.error || 'Calculation failed. Please try again.';

      if (apiError?.response?.status === 402) {
        setSubscriptionMessage(message);
        setShowSubscription(true);
      }

      setCalcError(message);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');
    try {
      const response = isLoginView
        ? await masterLogin({ email, password })
        : await masterSignup({ username, email, password });

      if (isVerificationRequired(response)) {
        setIsVerificationView(true);
        setAuthError(response.message);
        return;
      }

      const appToken = response.appAccessToken
        || await refreshAppToken(response.refreshToken);

      setAuth(appToken, response.refreshToken, response.user);
      setShowLogin(false);
    } catch (err: unknown) {
      const authErrorResponse = err as { response?: { data?: { message?: string } } };
      setAuthError(authErrorResponse.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');
    try {
      await verifyCode({ email, verification_code: verificationCode });
      // After verification, switch back to login to get tokens
      setIsVerificationView(false);
      setIsLoginView(true);
      setAuthError('Email verified! Please sign in with your password.');
    } catch (err: unknown) {
      const authErrorResponse = err as { response?: { data?: { error?: string } } };
      setAuthError(authErrorResponse.response?.data?.error || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setCalcError('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setCalcError('');
  };
  return (
    <div className="app-container">
      <header className="app-header animate-fade-in">
        <div className="universal-brand">
          <span className="logo-dot"></span>
          <span className="brand-text">Universal Calculator</span>
          {isPro && <span className="pro-badge">PRO</span>}
        </div>

        {isAuthenticated ? (
          <div className="user-profile">
            <span className="user-name">Hi, {user?.username}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button className="btn-login-trigger" onClick={() => setShowLogin(true)}>Login</button>
        )}
      </header>

      {notification && (
        <div className={`notification ${notification.type} animate-slide-down`}>
          {notification.message}
          <button onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      <div className="main-layout">
        <div className="calculator-stack">
          <div className="calculator-card glass animate-fade-in">
            <div className="display-section">
              <div className="equation">{equation}</div>
              <div className="current-display">{display}</div>
              {calcError && <div className="error-message">{calcError}</div>}
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
                style={{ width: `${(opCount / operationLimit) * 100}%` }}
              ></div>
            </div>
            <span>{isPro ? 'Pro Member' : `Free Tier: ${opCount}/${operationLimit} Operations`}</span>
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
              <h3>{isVerificationView ? 'Verify Email' : (isLoginView ? 'Welcome Back' : 'Create Account')}</h3>
              <p>{isVerificationView ? 'Enter the code sent to your email' : (isLoginView ? 'Login to continue calculating' : 'Join Universal for more features')}</p>
            </div>

            {isVerificationView ? (
              <form onSubmit={handleVerification} className="auth-form">
                <div className="input-group">
                  <label>Verification Code</label>
                  <input 
                    type="text" 
                    value={verificationCode} 
                    onChange={(e) => setVerificationCode(e.target.value)} 
                    placeholder="6-digit code"
                    maxLength={6}
                    required 
                  />
                </div>

                {authError && <div className="error-message">{authError}</div>}

                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>
                
                <div className="auth-footer">
                   <p>Didn't get a code? <span onClick={() => setIsVerificationView(false)}>Go back</span></p>
                </div>
              </form>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}

      {showSubscription && (
        <div className="modal-overlay">
          <div className="subscription-modal glass animate-fade-in">
            <div className="modal-header">
              <h3>{subscriptionMessage.includes('expired') ? 'Subscription Expired' : 'Upgrade to Pro'}</h3>
              <p>{subscriptionMessage || "You've reached the limit of free operations."}</p>
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
                <button className="btn-primary" onClick={handleSubscribe} disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Get Pro Now'}
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

