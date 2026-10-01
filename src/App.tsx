import './App.css'

const journeys = [
  {
    eyebrow: 'স্বপ্ন',
    title: 'Dream Analysis',
    description:
      'স্বপ্ন লিখুন বা voice transcript দিন। Maya symbols, themes, emotions ও reflective interpretation সাজিয়ে দেবে।',
    action: 'স্বপ্ন বিশ্লেষণ',
  },
  {
    eyebrow: 'জন্মছক',
    title: 'Birth Chart / Astro',
    description:
      'Birth date, time ও location থেকে deterministic chart facts-এর উপর পরিষ্কার interpretation পাবেন।',
    action: 'Astro শুরু করুন',
  },
  {
    eyebrow: 'কথোপকথন',
    title: 'Ask Maya',
    description:
      'Dream, symbols, astrology বা reflective প্রশ্ন নিয়ে Maya-র সঙ্গে Bengali-first conversation করুন।',
    action: 'Maya-কে জিজ্ঞেস করুন',
  },
] as const

function App() {
  return (
    <main className="maya-shell">
      <div className="astral-glow astral-glow-one" />
      <div className="astral-glow astral-glow-two" />

      <section className="hero" aria-labelledby="maya-title">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>
          <span className="brand-name">ORBIS MAYA</span>
          <span className="phase-pill">Astral</span>
        </div>

        <p className="hero-kicker">স্বপ্ন · জ্যোতিষ · আত্মঅন্বেষণ</p>

        <h1 id="maya-title">
          আপনার অন্তর্জগতের{' '}
          <span>একটি শান্ত AI companion</span>
        </h1>

        <p className="hero-copy">
          Dream interpretation, calculated astrology এবং reflective
          conversation—একটি private, mobile-first experience-এ।
        </p>

        <div className="privacy-note">
          <span aria-hidden="true">◈</span>
          <p>
            ব্যক্তিগত history এই device-এই রাখার জন্য Maya তৈরি হচ্ছে।
            Mystical interpretation কখনো scientific certainty হিসেবে
            দেখানো হবে না।
          </p>
        </div>
      </section>

      <section className="journey-grid" aria-label="Maya experiences">
        {journeys.map((journey) => (
          <article className="journey-card" key={journey.title}>
            <p className="card-eyebrow">{journey.eyebrow}</p>
            <h2>{journey.title}</h2>
            <p>{journey.description}</p>
            <button type="button">{journey.action}</button>
          </article>
        ))}
      </section>

      <section className="local-strip" aria-label="Local-first status">
        <div>
          <span className="status-dot" />
          <strong>Local-first</strong>
        </div>
        <p>
          History, voice এবং account experience পরবর্তী verified
          capability steps-এ যুক্ত হবে।
        </p>
      </section>

      <footer>
        <span>ORBIS Maya</span>
        <span>V3 Astral · PWA Foundation</span>
      </footer>
    </main>
  )
}

export default App
