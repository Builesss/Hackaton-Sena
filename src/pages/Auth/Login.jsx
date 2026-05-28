import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from '../../services/auth';
import { getProfile } from '../../services/auth';
import { supabase } from '../../services/supabase';
import '../../styles/auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [globalErr, setGlobalErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo inválido';
    if (!form.password) e.password = 'La contraseña es requerida';
    return e;
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setGlobalErr('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await signIn(form.email, form.password);
      const { data } = await supabase.auth.getUser();
      const prof = await getProfile(data.user?.id);
      if (prof?.role === 'admin') navigate('/');
      else navigate('/mapa');
    } catch (err) {
      setGlobalErr(err.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Brand Panel ── */}
      <div className="auth-brand">
        <div className="auth-brand-blob" />
        <div className="auth-brand-blob2" />

        <div className="auth-logo">
          <img src="/previmed.png" alt="PREVIMED logo" />
          <div>
            <div className="auth-logo-name">PREVIMED</div>
            <div className="auth-logo-sub">Movilidata OS</div>
          </div>
        </div>

        <h1 className="auth-brand-headline">
          Movilidad Inteligente<br />para <span>Medellín</span>
        </h1>
        <p className="auth-brand-desc">
          Plataforma de predicción de tráfico, alertas en tiempo real y ruteo seguro con inteligencia artificial para conductores y administradores de la ciudad.
        </p>

        <div className="auth-brand-features">
          {[
            { icon: '🚦', text: 'Monitoreo de tráfico en tiempo real' },
            { icon: '🧠', text: 'Predicción de accidentes con IA' },
            { icon: '🗺️', text: 'Ruteo óptimo según condiciones actuales' },
            { icon: '🌧️', text: 'Alertas de lluvia y zonas inundables' },
          ].map(({ icon, text }) => (
            <div className="auth-feature-item" key={text}>
              <div className="auth-feature-icon">{icon}</div>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-card animate-in">
          <h2 className="auth-form-title">Bienvenido de nuevo</h2>
          <p className="auth-form-subtitle">Ingresa tus credenciales para continuar</p>

          {globalErr && (
            <div className="auth-global-error">
              <span>⚠️</span> {globalErr}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="login-email">Correo electrónico</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉️</span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="usuario@ejemplo.com"
                  value={form.email}
                  onChange={handleChange}
                  className={`auth-input${errors.email ? ' error' : ''}`}
                />
              </div>
              {errors.email && <div className="auth-error-text">⚠ {errors.email}</div>}
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="login-password">Contraseña</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="login-password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={`auth-input${errors.password ? ' error' : ''}`}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label="Mostrar/ocultar contraseña"
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <div className="auth-error-text">⚠ {errors.password}</div>}
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
              id="login-submit-btn"
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Ingresando...
                </>
              ) : '🚀 Ingresar al sistema'}
            </button>
          </form>

          <div className="auth-divider">o</div>

          <p className="auth-footer-text">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="auth-link">Crear cuenta gratis</Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            HackData CTGI SENA 2026 · PREVIMED
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
