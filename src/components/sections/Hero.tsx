import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-rose-200 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <p className="text-rose-400 text-sm font-medium tracking-widest uppercase mb-4">
          Digital Wedding Invitations
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl text-stone-800 leading-tight mb-6">
          Share Your
          <span className="text-rose-500 italic"> Special Day</span>
          <br />with the World
        </h1>
        <p className="text-stone-500 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
          Beautiful, customizable wedding invitation templates. Share with friends and family via a unique link. Collect RSVPs instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/store">
            <Button size="lg" className="w-full sm:w-auto">
              Browse Templates
            </Button>
          </Link>
          <Link href="/auth">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Create Your Invite
            </Button>
          </Link>
        </div>

        <div className="mt-16 flex justify-center gap-10 text-center">
          {[
            { num: '10+', label: 'Templates' },
            { num: '100%', label: 'Customizable' },
            { num: '∞', label: 'RSVPs' },
          ].map(({ num, label }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-stone-800">{num}</div>
              <div className="text-sm text-stone-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
