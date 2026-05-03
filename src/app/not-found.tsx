import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50">
      <div className="text-center px-4">
        <div className="text-7xl mb-4">💌</div>
        <h1 className="font-serif text-4xl text-stone-800 mb-3">Page Not Found</h1>
        <p className="text-stone-500 mb-8">The invitation you're looking for doesn't exist or has been removed.</p>
        <Link href="/">
          <Button size="lg">Back to Home</Button>
        </Link>
      </div>
    </div>
  )
}
