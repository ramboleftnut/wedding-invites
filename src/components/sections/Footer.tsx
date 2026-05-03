import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="font-serif text-2xl text-white mb-3">Vows & Co</div>
            <p className="text-sm leading-relaxed">
              Digital wedding invitations crafted with love. Share your special day with everyone who matters.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/store" className="hover:text-white transition-colors">Templates</Link></li>
              <li><Link href="/auth" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>📧 hello@vowsandco.com</li>
              <li>💬 @vowsandco</li>
              <li className="mt-4 text-xs">
                We typically respond within 24 hours.
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs">© {new Date().getFullYear()} Vows & Co. All rights reserved.</p>
          <div className="flex gap-4 text-xs">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
