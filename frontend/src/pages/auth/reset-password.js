import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/config/firebase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { oobCode, mode } = router.query;
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'resetPassword' && oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then(email => setVerifiedEmail(email))
        .catch(() => setError('Invalid or expired reset link.'));
    }
  }, [oobCode, mode]);

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setConfirmed(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      setError('Failed to reset password. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '12px', background: '#fff' }}>
      <h2>{confirmed ? '✅ Password Set!' : '🔐 Set Your Password'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!confirmed && verifiedEmail && (
        <form onSubmit={handleReset}>
          <p>Setting password for <strong>{verifiedEmail}</strong></p>
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ width: '100%', background: '#007bff', color: '#fff', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Set Password</button>
        </form>
      )}
      {confirmed && <p style={{ color: 'green' }}>Redirecting to login...</p>}
    </div>
  );
}