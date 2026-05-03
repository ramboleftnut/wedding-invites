export default function About() {
  const steps = [
    { icon: '🎨', title: 'Choose a Template', desc: 'Browse our beautiful collection of wedding invitation designs.' },
    { icon: '✏️', title: 'Customize Your Invite', desc: 'Add your names, date, location, and personal touch.' },
    { icon: '📨', title: 'Share the Link', desc: 'Send your unique link to guests via WhatsApp, email, or social media.' },
    { icon: '✅', title: 'Collect RSVPs', desc: 'Track responses from your dashboard in real time.' },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-rose-400 text-sm font-medium tracking-widest uppercase mb-3">How it works</p>
          <h2 className="font-serif text-4xl text-stone-800">Simple, Elegant, Memorable</h2>
          <p className="text-stone-500 mt-4 max-w-xl mx-auto">
            From picking a design to collecting RSVPs — everything in one place, completely digital.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                {step.icon}
              </div>
              <div className="text-xs font-semibold text-rose-400 mb-1">STEP {i + 1}</div>
              <h3 className="font-semibold text-stone-800 mb-2">{step.title}</h3>
              <p className="text-sm text-stone-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
