import { type FormEvent, useState } from 'react'

export function EmailCapture() {
  const [email, setEmail] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    window.location.hash = 'cta'
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-[480px] flex-col sm:flex-row"
    >
      <label htmlFor="hero-email" className="sr-only">
        Email address
      </label>
      <input
        id="hero-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="hero-email-input flex-1 min-w-0 bg-transparent border border-ivory border-b sm:border-b sm:border-r-0 text-ivory text-body px-5 py-3.5 outline-none placeholder:text-ash-text rounded-t-[32px] rounded-b-none sm:rounded-l-[32px] sm:rounded-tr-none sm:rounded-br-none focus:border-signal transition-colors"
      />
      <button
        type="submit"
        className="bg-signal text-pure-white text-body font-normal px-6 py-3.5 border-0 cursor-pointer whitespace-nowrap rounded-b-[32px] rounded-t-none sm:rounded-r-[32px] sm:rounded-l-none hover:bg-signal-tint transition-colors"
      >
        Start free trial
      </button>
    </form>
  )
}
