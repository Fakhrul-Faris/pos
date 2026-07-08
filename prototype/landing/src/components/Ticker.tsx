type TickerProps = {
  items: string[]
  'aria-label'?: string
}

function TickerGroup({
  items,
  duplicate,
}: {
  items: string[]
  duplicate?: boolean
}) {
  return (
    <div className="c-ticker__group" aria-hidden={duplicate}>
      {items.map((item, index) => (
        <span key={`${duplicate ? 'dup' : 'orig'}-${index}`} className="c-ticker__item">
          {item}
          <span className="c-ticker__sep" aria-hidden>
            ·
          </span>
        </span>
      ))}
    </div>
  )
}

export function Ticker({ items, 'aria-label': ariaLabel }: TickerProps) {
  return (
    <section className="c-ticker" aria-label={ariaLabel}>
      <div className="c-ticker__viewport">
        <div className="c-ticker__track">
          <TickerGroup items={items} />
          <TickerGroup items={items} duplicate />
        </div>
      </div>
    </section>
  )
}
