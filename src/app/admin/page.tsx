import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import AdminPage from '@/components/featured-pages/AdminPage'

export const metadata = {
  title: 'Admin — Vows & Co',
}

export default function Admin() {
  return (
    <>
      <Navbar />
      <AdminPage />
      <Footer />
    </>
  )
}
