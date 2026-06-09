import React, { useState } from 'react';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';

export default function PinSetupModal({ isOpen, onSubmit }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN must be between 4 and 6 digits long and contain only numbers.');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match. Please verify your entry.');
      return;
    }

    onSubmit(pin);
  };

  return (
    <div className="modal-overlay pin-setup-overlay">
      <div className="modal-content pin-setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pin-modal-icon">
          <ShieldAlert size={36} />
        </div>
        
        <h2>Set Up Backup PIN</h2>
        <p className="modal-description">
          Create a 4-to-6 digit backup PIN. This allows you to decrypt and access your private notes completely offline if Google Authentication is unavailable.
        </p>

        <form onSubmit={handleSubmit} className="pin-setup-form">
          <div className="pin-input-wrapper">
            <label htmlFor="setup-pin">Choose PIN</label>
            <div className="input-with-icon">
              <input
                id="setup-pin"
                type={showPin ? 'text' : 'password'}
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
              <button
                type="button"
                className="toggle-password-visibility"
                onClick={() => setShowPin(!showPin)}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pin-input-wrapper">
            <label htmlFor="confirm-pin">Confirm PIN</label>
            <div className="input-with-icon">
              <input
                id="confirm-pin"
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                placeholder="••••••"
                value={confirmPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setConfirmPin(val);
                  setError('');
                }}
              />
            </div>
          </div>

          {error && <div className="pin-error-alert">{error}</div>}

          <button type="submit" className="pin-submit-btn">
            Save Backup PIN
          </button>
        </form>
      </div>
    </div>
  );
}
