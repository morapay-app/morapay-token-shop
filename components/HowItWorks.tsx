const STEPS = [
  {
    title: "Enter amount",
    body: "Choose how much to spend in your local currency.",
  },
  {
    title: "Pay with MoMo or bank",
    body: "Approve a mobile money prompt or transfer to the deposit account.",
  },
  {
    title: "Receive tokens",
    body: "Tokens are sent to your own wallet — usually a few minutes.",
  },
];

export function HowItWorks() {
  return (
    <section className="w-full max-w-[480px] mx-auto px-4 py-8">
      <h2 className="font-heading text-2xl font-bold mb-4">How it works</h2>
      <ol className="space-y-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="font-numbers font-extrabold text-[var(--brand-accent-on-light)] w-8 shrink-0">
              {i + 1}
            </span>
            <div>
              <p className="font-heading font-semibold">{s.title}</p>
              <p className="text-sm text-[var(--mp-text-muted)]">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
