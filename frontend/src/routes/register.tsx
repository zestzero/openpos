import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      await register(email, password)
      toast.success('Account created successfully!')
      navigate({ to: '/pos' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        
        .auth-container * {
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
        }
        
        .auth-title {
          font-family: 'Outfit', system-ui, -apple-system, sans-serif;
        }
        
        .auth-gradient-text {
          background: linear-gradient(135deg, #059669 0%, #14b8a6 50%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .auth-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 20px 60px rgba(20, 184, 166, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08);
        }
        
        .auth-input:focus {
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
          border-color: #14b8a6;
        }
        
        .auth-button {
          background: linear-gradient(135deg, #059669 0%, #14b8a6 100%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .auth-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 30px rgba(20, 184, 166, 0.3);
        }
        
        .auth-button:active:not(:disabled) {
          transform: translateY(0);
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        .floating-shape {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
      
      {/* Decorative floating shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="floating-shape absolute top-20 left-[10%] w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-3xl" style={{ animationDelay: '0s' }} />
        <div className="floating-shape absolute bottom-32 right-[15%] w-40 h-40 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full blur-3xl" style={{ animationDelay: '2s' }} />
        <div className="floating-shape absolute top-1/3 right-[8%] w-24 h-24 bg-gradient-to-br from-cyan-400 to-emerald-500 rounded-full blur-3xl" style={{ animationDelay: '4s' }} />
      </div>

      <div className="auth-container w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="auth-title text-5xl font-bold mb-2 auth-gradient-text tracking-tight">
            OpenPOS
          </h1>
          <p className="text-slate-600 text-sm font-medium">Modern Point of Sale System</p>
        </div>

        <Card className="auth-card border-0">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="auth-title text-2xl font-semibold tracking-tight">
              Create your account
            </CardTitle>
            <CardDescription className="text-slate-600">
              Register as a store owner to get started
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="auth-input transition-all"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="auth-input transition-all"
                  autoComplete="new-password"
                />
                <p className="text-xs text-slate-500">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="auth-input transition-all"
                  autoComplete="new-password"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="auth-button w-full font-semibold"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
              
              <div className="text-center text-sm">
                <span className="text-slate-600">Already have an account? </span>
                <Link
                  to="/login"
                  className="font-semibold text-teal-600 hover:text-teal-700 transition-colors underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer text */}
        <p className="text-center text-xs text-slate-500 mt-8">
          By creating an account, you will be registered as a store owner
        </p>
      </div>
    </div>
  )
}
