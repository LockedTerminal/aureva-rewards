import { useWallet } from '../context/WalletContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';

export async function getServerSideProps() {
  return { props: {} };
}

export default function Home() {
  const { publicKey, connect, loading, error, freighterInstalled, disconnect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (publicKey) router.push('/dashboard');
  }, [publicKey, router]);

  return (
    <>
      <Head>
        <title>Aureva Rewards — Loyalty points that belong to you</title>
        <meta name="description" content="Aureva Rewards puts your earned points on Stellar — transferable, tradeable, and yours forever." />
      </Head>

      <div style={{ background: '#0a0a0f', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif', color: '#fff', overflowX: 'hidden' }}>

        {/* ── Starfield background ── */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          {[...Array(60)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              background: 'rgba(255,255,255,' + (Math.random() * 0.5 + 0.1) + ')',
              borderRadius: '50%',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
            }} />
          ))}
        </div>

        {/* ── Navbar ── */}
        <nav style={{
          position: 'relative', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 3rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(10px)',
          background: 'rgba(10,10,15,0.8)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 800,
            }}>⭐</div>
            <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>
              <span style={{ color: '#fff' }}>Aureva </span>
              <span style={{ color: '#a78bfa' }}>Rewards</span>
            </span>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            {['Features', 'How It Works', 'For Merchants', 'Docs'].map(link => (
              <a key={link} href="#" style={{ color: '#94a3b8', fontSize: '0.9rem', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = '#94a3b8'}
              >{link}</a>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 0.9rem', borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.15)',
              fontSize: '0.82rem', color: '#94a3b8',
            }}>
              <span style={{ fontSize: '0.7rem' }}>🚀</span> Stellar
            </div>
            <button
              onClick={publicKey ? () => router.push('/dashboard') : connect}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000', border: 'none', borderRadius: 999,
                padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.88rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}>
              🚀 {loading ? 'Connecting…' : 'Launch App'}
            </button>
          </div>
        </nav>

        {/* ── Hero Section ── */}
        <section style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6rem 3rem 4rem',
          maxWidth: 1200, margin: '0 auto',
          gap: '3rem',
        }}>
          {/* Left — Text */}
          <div style={{ flex: 1, maxWidth: 540 }}>
            {/* Live badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.3rem 0.85rem', borderRadius: 999,
              border: '1px solid rgba(34,197,94,0.3)',
              background: 'rgba(34,197,94,0.08)',
              fontSize: '0.78rem', color: '#4ade80', marginBottom: '1.75rem',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Live on Stellar Mainnet
            </div>

            {/* Heading */}
            <h1 style={{ fontSize: '3.6rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              Loyalty points<br />that belong to<br />
              <span style={{ color: '#7c3aed' }}>you.</span>
            </h1>

            {/* Subtext */}
            <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 440 }}>
              Aureva Rewards puts your earned points on Stellar — transferable,
              tradeable, and yours forever. No expiry. No fine print.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button
                onClick={publicKey ? () => router.push('/dashboard') : connect}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000', border: 'none', borderRadius: 999,
                  padding: '0.85rem 2rem', fontWeight: 700, fontSize: '1rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                {loading ? 'Connecting…' : 'Get Started →'}
              </button>
              <button style={{
                background: 'transparent', color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 999, padding: '0.85rem 2rem',
                fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
              }}>
                See How It Works
              </button>
            </div>

            {/* Powered by Stellar */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.3rem 0.85rem', borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: '0.78rem', color: '#64748b',
            }}>
              <span>🌐</span> Powered by Stellar
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '1rem' }}>{error}</p>}
          </div>

          {/* Right — AUR Balance Card */}
          <div style={{ flex: '0 0 auto', position: 'relative' }}>
            {/* Glow effect */}
            <div style={{
              position: 'absolute', inset: -30,
              background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, rgba(245,158,11,0.1) 50%, transparent 70%)',
              borderRadius: '50%', filter: 'blur(20px)', zIndex: 0,
            }} />

            {/* Card */}
            <div style={{
              position: 'relative', zIndex: 1,
              background: 'linear-gradient(135deg, rgba(30,20,50,0.95), rgba(20,15,35,0.98))',
              border: '1.5px solid',
              borderImage: 'linear-gradient(135deg, #f59e0b, #7c3aed) 1',
              borderRadius: 20,
              padding: '2rem 2.5rem',
              minWidth: 300,
              boxShadow: '0 0 40px rgba(124,58,237,0.3), 0 0 80px rgba(245,158,11,0.1)',
              backdropFilter: 'blur(20px)',
            }}>
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    AUR BALANCE
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                    GA2X...K9P3
                  </div>
                </div>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                }}>⭐</div>
              </div>

              {/* Balance amount */}
              <div style={{ marginBottom: '1.75rem' }}>
                <span style={{ fontSize: '2.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>1,240 </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a78bfa' }}>AUR</span>
              </div>

              {/* Card footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Aureva Network</span>
                <span style={{ fontSize: '0.8rem', color: '#7c3aed', cursor: 'pointer' }}>Never expires →</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Section ── */}
        <section style={{
          position: 'relative', zIndex: 1,
          maxWidth: 1200, margin: '0 auto',
          padding: '0 3rem 5rem',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1px', background: 'rgba(255,255,255,0.08)',
            borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {[
              { icon: '👥', value: '12,400+', label: 'Active Users' },
              { icon: '🏪', value: '340+', label: 'Merchant Partners' },
              { icon: '💰', value: '$0.001', label: 'Average Fees' },
              { icon: '⚡', value: '4.2s', label: 'Average Speed' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(15,12,25,0.9)',
                padding: '2rem 1.5rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section style={{
          position: 'relative', zIndex: 1,
          maxWidth: 1000, margin: '0 auto',
          padding: '0 3rem 5rem',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(40,25,15,0.95), rgba(25,15,40,0.95))',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 24, padding: '4rem 3rem',
            textAlign: 'center',
            boxShadow: '0 0 60px rgba(245,158,11,0.08), 0 0 120px rgba(124,58,237,0.08)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Glow */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400, height: 200,
              background: 'radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.75rem', position: 'relative' }}>
              Start earning rewards
            </h2>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f59e0b', marginBottom: '1.25rem', position: 'relative' }}>
              that are actually yours.
            </p>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem', position: 'relative' }}>
              Connect your Freighter wallet and join the Aureva network.
            </p>
            <button
              onClick={publicKey ? () => router.push('/dashboard') : connect}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000', border: 'none', borderRadius: 999,
                padding: '0.9rem 2.5rem', fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer', position: 'relative',
              }}>
              {loading ? 'Connecting…' : 'Launch App →'}
            </button>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          position: 'relative', zIndex: 1,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(5,5,10,0.95)',
          padding: '3rem',
        }}>
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
            gap: '3rem', marginBottom: '2.5rem',
          }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                }}>⭐</div>
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                  <span style={{ color: '#fff' }}>Aureva </span>
                  <span style={{ color: '#a78bfa' }}>Rewards</span>
                </span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.84rem', lineHeight: 1.6, maxWidth: 280, marginBottom: '1.25rem' }}>
                Loyalty, owned by you. Earn points that live in your wallet — not in someone else&apos;s database.
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.3rem 0.85rem', borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.78rem', color: '#475569',
              }}>
                🌐 Built on Stellar
              </div>
            </div>

            {/* Product links */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>Product</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {['Features', 'How It Works', 'For Merchants', 'Launch App'].map(link => (
                  <a key={link} href="#" style={{ color: '#475569', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#a78bfa'}
                    onMouseLeave={e => e.target.style.color = '#475569'}
                  >{link}</a>
                ))}
              </div>
            </div>

            {/* Community links */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>Community</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {[
                  { label: 'GitHub', icon: '🐙' },
                  { label: 'Twitter', icon: '🐦' },
                  { label: 'Docs', icon: '📄' },
                ].map(item => (
                  <a key={item.label} href="#" style={{ color: '#475569', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#475569'; }}
                  >
                    <span>{item.icon}</span> {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Footer bottom */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '1.5rem', textAlign: 'center',
            color: '#334155', fontSize: '0.8rem',
          }}>
            © 2026 Aureva Rewards. Built on Stellar. All rights reserved.
          </div>
        </footer>

      </div>
    </>
  );
}
