import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../../services/auth';
import '../../styles/auth.css';

const pwdStrength = (pwd) => {
  if (pwd.length === 0) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [globalErr, setGlobalErr] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const strength = pwdStrength(form.password);
  const strengthLabels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const strengthColors = ['', 'filled-weak', 'filled-weak', 'filled-medium', 'filled-strong'];

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name    = 'El nombre es requerido';
    if (!form.email)        e.email   = 'El correo es requerido';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo inválido';
    if (!form.password)     e.password = 'La contraseña es requerida';
    else if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (form.password !== form.confirm) e.confirm = 'Las contraseñas no coinciden';
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
      await signUp(form.email, form.password, form.name.trim());
      setSuccess('¡Cuenta creada! Redirigiendo al navegador...');
      setTimeout(() => navigate('/mapa'), 1800);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already registered')) {
        setGlobalErr('Este correo ya está registrado. ¿Deseas iniciar sesión?');
      } else {
        setGlobalErr(msg || 'Error al crear la cuenta.');
      }
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
          Tu ruta más <span>segura</span><br />empieza aquí
        </h1>
        <p className="auth-brand-desc">
          Únete a PREVIMED y accede a la navegación inteligente: ve el tráfico, los puntos de accidente y las zonas de lluvia en tiempo real para llegar siempre seguro.
        </p>

        <div className="auth-brand-features">
          {[
            { icon: '📍', text: 'Comparte tu ubicación y encontramos la mejor ruta' },
            { icon: '⚠️', text: 'Evita zonas de alta accidentalidad' },
            { icon: '🌧️', text: 'Alertas de lluvia antes de salir' },
            { icon: '🏆', text: 'Ruta con mayor puntaje de seguridad IA' },
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
          <h2 className="auth-form-title">Crear cuenta</h2>
          <p className="auth-form-subtitle">Es gratis · Solo toma un minuto</p>

          {globalErr && (
            <div className="auth-global-error">
              <span>⚠️</span>
              <span>{globalErr} {globalErr.includes('iniciar sesión') && <Link to="/login" className="auth-link">Ir a login</Link>}</span>
            </div>
          )}
          {success && (
            <div className="auth-global-success">
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-name">Nombre completo</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">👤</span>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Juan Pérez"
                  value={form.name}
                  onChange={handleChange}
                  className={`auth-input${errors.name ? ' error' : ''}`}
                />
              </div>
              {errors.name && <div className="auth-error-text">⚠ {errors.name}</div>}
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-email">Correo electrónico</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">✉️</span>
                <input
                  id="reg-email"
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
              <label className="auth-label" htmlFor="reg-password">Contraseña</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="reg-password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  className={`auth-input${errors.password ? ' error' : ''}`}
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPwd(v => !v)}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {form.password && (
                <div>
                  <div className="pwd-strength" style={{ marginTop: 8 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`pwd-bar${i <= strength ? ` ${strengthColors[strength]}` : ''}`} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Seguridad: <strong>{strengthLabels[strength]}</strong>
                  </div>
                </div>
              )}
              {errors.password && <div className="auth-error-text">⚠ {errors.password}</div>}
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-confirm">Confirmar contraseña</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">🔐</span>
                <input
                  id="reg-confirm"
                  name="confirm"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  value={form.confirm}
                  onChange={handleChange}
                  className={`auth-input${errors.confirm ? ' error' : ''}`}
                />
              </div>
              {errors.confirm && <div className="auth-error-text">⚠ {errors.confirm}</div>}
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
              id="register-submit-btn"
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Creando cuenta...
                </>
              ) : '🎯 Crear mi cuenta'}
            </button>
          </form>

          <div className="auth-divider">o</div>

          <p className="auth-footer-text">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="auth-link">Iniciar sesión</Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            HackData CTGI SENA 2026 · PREVIMED
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
