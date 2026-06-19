import PUPLogo from '../../Asset/PUP_LOGO.png'

export function PupFooter() {
  return (
    <footer className="pup-footer">
      {/* Left: PUP Seal */}
      <div className="pup-footer-logo">
        <img src={PUPLogo} alt="PUP Caloocan Seal" />
        <span style={{
          fontSize: 'var(--text-2xs)',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.55)',
          fontFamily: 'var(--font-ui)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          PUP Caloocan
        </span>
      </div>

      {/* Center: System label */}
      <div className="pup-footer-center">
        <span className="pup-footer-label">DEVELOPERS</span>
        <span className="pup-footer-system">Evaluation and Monitoring System</span>
      </div>

      {/* Right: Academic info */}
      <div className="pup-footer-right">
        <span>Polytechnic University of the Philippines</span>
        <span>Caloocan Campus — AY 2025–2026</span>
      </div>
    </footer>
  )
}
