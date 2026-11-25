/** Original π coin mark (128×128 viewBox): purple disc, gold ring and glyph. */
function PiMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128">
      <circle cx="64" cy="64" r="62" fill="#5B2E96" />
      <circle cx="64" cy="64" r="53" fill="none" stroke="#F0B44A" strokeWidth="3.5" opacity="0.85" />
      <g fill="none" stroke="#FFC94D" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
        <path d="M36 52 Q38 42 49 42 H92" />
        <path d="M55 44 Q55 72 44 90" />
        <path d="M77 44 V79 Q77 90 88 89" />
      </g>
    </svg>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px 22px",
        borderRadius: 999,
        border: "2px solid rgba(255,201,77,0.4)",
        background: "rgba(255,201,77,0.12)",
        color: "#FDECC8",
        fontSize: 24,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

/** 1200×630 link preview for the Pi shop. */
export function PiOgImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "linear-gradient(135deg, #1C0B38 0%, #2E1257 45%, #5B2E96 100%)",
        color: "#FAF7FF",
        fontFamily: "sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -120,
          top: -60,
          width: 620,
          height: 620,
          borderRadius: 620,
          background: "radial-gradient(circle, rgba(255,201,77,0.22) 0%, rgba(255,201,77,0) 70%)",
          display: "flex",
        }}
      />
      <div style={{ position: "absolute", right: 80, top: 110, display: "flex" }}>
        <PiMark size={410} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          width: 720,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <PiMark size={56} />
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#E3D4FA" }}>
            Pi Shop
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1 }}>
            Buy and sell Pi
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "rgba(237,228,252,0.82)", lineHeight: 1.3 }}>
            Pay with mobile money or bank. Native PI to your Pi wallet.
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <Chip>GHS</Chip>
            <Chip>NGN</Chip>
            <Chip>Pi Network</Chip>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#FFC94D" }}>Powered by Morapay</div>
      </div>
    </div>
  );
}
