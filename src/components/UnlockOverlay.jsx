import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, Key, Globe, CloudOff, Info } from 'lucide-react';

export default function UnlockOverlay({
  categoryName,
  isOnline,
  onUnlockPin,
  onSimulateGoogleLogin,
  hasPinVault,
  onCancel
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!pin.trim()) {
      setError('Please enter your PIN');
      return;
    }

    const success = onUnlockPin(pin);
    if (!success) {
      setError('Incorrect PIN. Authentication failed.');
    }
  };

  const [googleLoaded, setGoogleLoaded] = useState(!!window.google?.accounts?.id);
  const googleBtnRef = React.useRef(null);

  // Poll for the Google API library loading
  useEffect(() => {
    if (googleLoaded) return;
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setGoogleLoaded(true);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [googleLoaded]);

  // Render Google Sign-in button when online and library is available
  useEffect(() => {
    if (isOnline && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.renderButton(
          googleBtnRef.current,
          { theme: 'filled_blue', size: 'large', width: '280' }
        );
      } catch (err) {
        console.error('Error rendering Google button in overlay', err);
      }
    }
  }, [isOnline, googleLoaded]);

  return (
    <div className="unlock-overlay-container">
      <div className="unlock-card glassmorphic">
        <div className="lock-icon-badge">
          <Lock size={32} />
        </div>
        
        <h2>Category Locked</h2>
        <p className="unlock-subtitle">
          Notes under <strong>#{categoryName}</strong> are private and encrypted. Unlock your secure vault to access them.
        </p>

        {/* Status indicator */}
        <div className="connection-status-badge">
          {isOnline ? (
            <span className="badge-online">
              <Globe size={12} /> Google Auth Available
            </span>
          ) : (
            <span className="badge-offline">
              <CloudOff size={12} /> Working Offline (PIN Only)
            </span>
          )}
        </div>

        {/* Section: Google Sign-in */}
        {isOnline && (
          <div className="auth-method-section google-auth-sec">
            <div ref={googleBtnRef} className="google-btn-wrapper"></div>
            
            {/* Simulation Option for ease of testing */}
            <button
              type="button"
              className="simulate-auth-btn"
              onClick={onSimulateGoogleLogin}
              title="Simulate a successful Google Sign-in for testing purposes"
            >
              Simulate Google Login
            </button>
          </div>
        )}

        {isOnline && <div className="divider-or"><span>OR</span></div>}

        {/* Section: Offline PIN */}
        <div className="auth-method-section pin-auth-sec">
          <h3>
            <Key size={14} /> Enter Backup PIN
          </h3>
          
          {!hasPinVault ? (
            <div className="pin-info-box">
              <Info size={14} />
              <span>No backup PIN set up yet. Log in with Google first to set one.</span>
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="overlay-pin-form">
              <input
                type="password"
                maxLength={6}
                placeholder="••••••"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPin(val);
                  setError('');
                }}
              />
              <button type="submit" className="pin-unlock-submit-btn">
                Unlock Vault
              </button>
            </form>
          )}
          {error && <span className="overlay-error-msg">{error}</span>}
        </div>

        {onCancel && (
          <button 
            type="button" 
            className="unlock-cancel-btn" 
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
