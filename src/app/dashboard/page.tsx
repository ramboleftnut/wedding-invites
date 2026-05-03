import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import DashboardPage from '@/components/featured-pages/DashboardPage'

export const metadata = {
  title: 'Dashboard — Vows & Co',
}

export default function Dashboard() {
  return (
    <>
      <Navbar />
      <DashboardPage />
      <Footer />
    </>
  )
}
