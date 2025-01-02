import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useCreateUserMutation } from "@/api/routes/auth"
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function RegistrationPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Individual error states
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  
  // General form error
  const [error, setError] = useState('')

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [createUser, { isLoading, isError, error: createUserError }] = useCreateUserMutation()
  const navigate = useNavigate()

  const handlePasswordBlur = () => {
    // Clear any existing password error before validating
    setPasswordError('')

    // Validate the password
    if (!/\d/.test(password)) {
      setPasswordError('The password must contain at least 1 digit, 0-9.')
      return
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('The password must contain at least 1 uppercase letter, A-Z.')
      return
    }
    if (!/[a-z]/.test(password)) {
      setPasswordError('The password must contain at least 1 lowercase letter, a-z.')
      return
    }
  }

  const handleConfirmPasswordBlur = () => {
    // Clear any existing confirm-password error before validating
    setConfirmPasswordError('')

    // Validate matching passwords
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Final checks (e.g., if fields are empty or if errors exist)
    if (!email || !password || !confirmPassword) {
      setError('All fields are required')
      return
    }
    if (passwordError || confirmPasswordError) {
      // If there are existing error messages, don't proceed
      setError('Please fix the highlighted errors before submitting.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const response = await createUser({ email, password, name }).unwrap()
      if (response.status === true) {
        navigate("/login")
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-left text-2xl">Register</CardTitle>
          <CardDescription className="text-left">Create a new account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2 text-left">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            {/* Email */}
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {/* Password */}
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <Label htmlFor="password">Password</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Password must contain:</p>
                      <ul className="list-disc list-inside">
                        <li>At least 1 digit (0-9)</li>
                        <li>At least 1 uppercase letter (A-Z)</li>
                        <li>At least 1 lowercase letter (a-z)</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={handlePasswordBlur}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            </div>
            {/* Confirm Password */}
            <div className="space-y-2 text-left">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={handleConfirmPasswordBlur}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {confirmPasswordError && (
                <p className="text-sm text-red-500">{confirmPasswordError}</p>
              )}
            </div>

            {/* General form errors */}
            {error && <p className="text-sm text-red-500">{error}</p>}
            {/* Server-side error */}
            {isError && (
              <p className="text-sm text-red-500">
                {('data' in createUserError!) 
                  ? (createUserError.data as { message: string })?.message ?? "An unexpected error occurred."
                  : "An unexpected error occurred."
                }
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              Register
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}