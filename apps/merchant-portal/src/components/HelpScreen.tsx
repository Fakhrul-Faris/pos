'use client'

export function HelpScreen() {
  return (
    <div className="h-full w-full rounded-xl border border-fog px-4 py-4 sm:px-6 sm:py-6">
      <p className="text-xs font-medium tracking-ui text-sky">Help</p>
      <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
        Merchant → Miki
      </h1>
      <p className="mt-2 text-sm text-ash">
        Docs and contact for shop owners. This is not the customer complaint inbox
        (that lives in Admin Portal).
      </p>

      <ul className="mt-8 space-y-3">
        <li className="rounded-2xl border border-fog bg-paper-white px-4 py-4">
          <p className="text-sm font-medium text-carbon">Documentation</p>
          <p className="mt-1 text-sm text-ash">Setup guides and how-tos (link TBD).</p>
        </li>
        <li className="rounded-2xl border border-fog bg-paper-white px-4 py-4">
          <p className="text-sm font-medium text-carbon">Email</p>
          <p className="mt-1 text-sm text-ash">support@miki.my</p>
        </li>
        <li className="rounded-2xl border border-fog bg-paper-white px-4 py-4">
          <p className="text-sm font-medium text-carbon">WhatsApp</p>
          <p className="mt-1 text-sm text-ash">Priority channel on Mantis+ (mock).</p>
        </li>
      </ul>
    </div>
  )
}
