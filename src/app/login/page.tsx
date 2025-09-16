import Images from "@/assets/Images"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="h-screen bg-gray-50">
      {/* Header with MATBLOOM logo */}
      <header className="bg-teal-700 py-6">
        <div className="container px-1">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-white text-2xl font-bold tracking-wide">MATBLOOM</h1>
            <div className="text-teal-200">
              <img src={Images.logo.src} className="w-10 h-10" alt="logo" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content with login form */}
      <main className="flex flex-col h-[80%] items-center justify-center ">
        <LoginForm />
      </main>
    </div>
  )
}
