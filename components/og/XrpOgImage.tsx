/** XRP mark (24×24 viewBox), single path. */
const XRP_MARK =
  "M18.36 4.125h2.605l-5.42 5.781A4.92 4.92 0 0 1 12 11.443a4.9 4.9 0 0 1-3.546-1.537L3.026 4.125H5.64l4.112 4.429c1.204 1.277 3.291 1.277 4.496 0zM5.604 19.865H3l5.453-5.763a4.93 4.93 0 0 1 3.55-1.537 4.92 4.92 0 0 1 3.552 1.538L21 19.875h-2.605l-4.138-4.411c-1.205-1.277-3.291-1.277-4.496 0z";

function Chip({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px 22px",
        borderRadius: 999,
        border: "2px solid rgba(147,197,253,0.35)",
        background: "rgba(37,99,235,0.18)",
        color: "#DBEAFE",
        fontSize: 24,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

/** 1200×630 link preview for the XRP shop. */
export function XrpOgImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "linear-gradient(135deg, #0B1222 0%, #0F172A 45%, #1E3A8A 100%)",
        color: "#F8FAFC",
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
          background: "radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(56,189,248,0) 70%)",
          display: "flex",
        }}
      />
      <svg
        width="430"
        height="430"
        viewBox="0 0 24 24"
        style={{ position: "absolute", right: 70, top: 100, opacity: 0.95 }}
      >
        <path fill="#FFFFFF" d={XRP_MARK} />
      </svg>

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
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24">
              <path fill="#0F172A" d={XRP_MARK} />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#BFDBFE" }}>
            XRP Shop
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1 }}>
            Buy and sell XRP
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "rgba(226,232,240,0.82)", lineHeight: 1.3 }}>
            Pay with mobile money or bank. Native XRP straight to your wallet.
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <Chip>GHS</Chip>
            <Chip>NGN</Chip>
            <Chip>XRP Ledger</Chip>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#93C5FD" }}>Powered by Morapay</div>
      </div>
    </div>
  );
}
