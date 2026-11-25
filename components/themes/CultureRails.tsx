import type { CultureBlock, ShopConfig } from "@/config/schema";

type Culture = NonNullable<ShopConfig["culture"]>;

function BlockView({ block }: { block: CultureBlock }) {
  if (block.type === "quote") {
    return (
      <figure className="culture-block culture-quote">
        <blockquote>“{block.text}”</blockquote>
        {block.by ? <figcaption>— {block.by}</figcaption> : null}
      </figure>
    );
  }
  if (block.type === "blurb") {
    return (
      <div className="culture-block">
        <h3>{block.title}</h3>
        <p>{block.body}</p>
      </div>
    );
  }
  if (block.type === "pulse") {
    const inner = (
      <>
        <p className="culture-pulse-label">{block.label}</p>
        <p className="culture-pulse-detail">{block.detail}</p>
      </>
    );
    return block.href ? (
      <a
        className="culture-block culture-pulse"
        href={block.href}
        target="_blank"
        rel="noreferrer"
      >
        {inner}
      </a>
    ) : (
      <div className="culture-block culture-pulse">{inner}</div>
    );
  }
  if (block.type === "post") {
    const inner = (
      <>
        {block.source ? (
          <p className="culture-post-source">{block.source}</p>
        ) : null}
        <h3>{block.title}</h3>
        <p>{block.body}</p>
      </>
    );
    return block.href ? (
      <a
        className="culture-block culture-post"
        href={block.href}
        target="_blank"
        rel="noreferrer"
      >
        {inner}
      </a>
    ) : (
      <div className="culture-block culture-post">{inner}</div>
    );
  }
  return (
    <a
      className="culture-cta"
      href={block.href}
      target="_blank"
      rel="noreferrer"
    >
      {block.label}
    </a>
  );
}

export function CultureRail({
  blocks,
  side,
}: {
  blocks: CultureBlock[];
  side: "left" | "right";
}) {
  if (blocks.length === 0) return null;
  return (
    <aside
      className={`culture-rail culture-rail-${side}`}
      aria-label={`${side} culture`}
    >
      {blocks.map((block, i) => (
        <BlockView key={`${block.type}-${i}`} block={block} />
      ))}
    </aside>
  );
}

export function CultureMarquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  const loop = [...items, ...items];
  return (
    <div className="culture-marquee" aria-hidden="true">
      <div className="culture-marquee-track">
        {loop.map((item, i) => (
          <span key={`${item}-${i}`}>
            {item}
            <span className="culture-marquee-dot">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function CultureStageBrand({
  culture,
  ticker,
}: {
  culture: Culture;
  ticker: string;
}) {
  return (
    <div className="culture-brand">
      <p className="culture-eyebrow">
        <span className="culture-eyebrow-dot" aria-hidden="true" />
        ${ticker}
        <span className="culture-eyebrow-sep" aria-hidden="true">
          ·
        </span>
        {culture.brandLine}
      </p>
      {culture.roar ? <h1 className="culture-roar">{culture.roar}</h1> : null}
      {culture.homeUrl ? (
        <a
          className="culture-home-link"
          href={culture.homeUrl}
          target="_blank"
          rel="noreferrer"
        >
          Visit the pride →
        </a>
      ) : null}
    </div>
  );
}
