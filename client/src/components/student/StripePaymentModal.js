import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../../services/api';

let stripePromise = null;
function getStripe(pk) {
  if (!pk) return null;
  if (!stripePromise) stripePromise = loadStripe(pk);
  return stripePromise;
}

function PaymentForm({ onSuccess, onError, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);

    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: { return_url: window.location.href },
    });

    if (result.error) {
      onError(result.error.message || 'Payment failed');
      setBusy(false);
      return;
    }

    const intent = result.paymentIntent;
    try {
      await api.post('/payments/confirm', { paymentIntentId: intent.id });
      onSuccess();
    } catch (err) {
      onError(err.response?.data?.message || 'Could not confirm payment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" className="btn btn-primary" disabled={!stripe || busy} style={{ marginTop: '16px', width: '100%' }}>
        {busy ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

function StripePaymentModal({ booking, amount, onClose, onSuccess }) {
  const [clientSecret, setClientSecret] = useState('');
  const [pk, setPk] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const cfg = await api.get('/config/public');
        if (cancelled) return;
        if (!cfg.data.stripePublishableKey) {
          setError('Stripe is not configured. Ask an admin to set STRIPE_PUBLISHABLE_KEY.');
          return;
        }
        setPk(cfg.data.stripePublishableKey);

        const intent = await api.post('/payments/intent', {
          bookingId: booking._id,
          amount,
        });
        if (cancelled) return;
        setClientSecret(intent.data.clientSecret);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not start payment');
      }
    }
    start();
    return () => { cancelled = true; };
  }, [booking._id, amount]);

  const stripe = pk ? getStripe(pk) : null;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ margin: 0 }}>Pay for session</h2>
          <button onClick={onClose} style={S.closeBtn}>&times;</button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 0 }}>
          {booking.subject || 'Tutoring session'} with {booking.tutor?.name || 'your tutor'} — ${amount.toFixed(2)}
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        {!error && clientSecret && stripe && (
          <Elements stripe={stripe} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
            <PaymentForm amount={amount} onSuccess={onSuccess} onError={setError} />
          </Elements>
        )}
        {!error && !clientSecret && <p>Loading secure payment form...</p>}
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '460px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' },
};

export default StripePaymentModal;
