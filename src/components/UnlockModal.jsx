import React, { useState, useEffect } from 'react';
import { X, Lock, Key, Globe, CloudOff, Info } from 'lucide-react';

export default function UnlockModal({
  isOpen,
  onClose,
  isOnline,
  onUnlockPin,
  onSimulateGoogleLogin,
  hasPinVault
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && isOnline && window.google?.accounts?.id) {
      // Small timeout to ensure container is rendered
      const timer = setTimeout(() => {
        try {
          const container = document.getElementById('google-signin-btn-modal');
          if (container) {
            window.google.accounts.id.renderButton(container, {
              theme: 'filled_blue',
              size: 'large',
              width: '280'
            });
          }
        } catch (err) {
          console.error('Error rendering Google button in modal', err);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isOnline]);

  if (!isOpen) return null;

  const handlePinSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!pin.trim()) {
      setError('Please enter your PIN');
      return;
    }

    const success = onUnlockPin(pin);
    if (success) {
      setPin('');
      setError('');
      onClose();
    } else {
      setError('Incorrect PIN.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content unlock-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Unlock Secure Vault</h2>
          <button className="close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="unlock-modal-body">
          <div className="lock-icon-badge" style={{ margin: '0 auto 12px auto' }}>
            <Lock size={24} />
          </div>

          <p className="modal-description" style={{ textAlign: 'center', marginBottom: '16px' }}>
            Authenticate to view and modify your private encrypted notes.
          </p>

          <div className="connection-status-badge" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
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

          {/* Google Auth Method */}
          {isOnline && (
            <div className="auth-method-section google-auth-sec" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div id="google-signin-btn-modal" className="google-btn-wrapper"></div>

              <button
                type="button"
                className="simulate-auth-btn"
                onClick={() => {
                  onSimulateGoogleLogin();
                  onClose();
                }}
                style={{ width: '100%', maxWidth: '280px' }}
                title="Simulate a successful Google Sign-in for local testing"
              >
                Simulate Google Login
              </button>
            </div>
          )}

          {isOnline && <div className="divider-or" style={{ margin: '16px 0' }}><span>OR</span></div>}

          {/* PIN Auth Method */}
          <div className="auth-method-section pin-auth-sec" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>
              <Key size={14} /> Enter Backup PIN
            </h3>

            {!hasPinVault ? (
              <div className="pin-info-box" style={{ width: '100%' }}>
                <Info size={14} />
                <span>No backup PIN set up yet. Log in with Google online to create a PIN.</span>
              </div>
            ) : (
              <form onSubmit={handlePinSubmit} className="overlay-pin-form" style={{ width: '100%' }}>
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
                  autoFocus
                />
                <button type="submit" className="pin-unlock-submit-btn">
                  Unlock
                </button>
              </form>
            )}
            {error && <span className="overlay-error-msg" style={{ marginTop: '6px' }}>{error}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
