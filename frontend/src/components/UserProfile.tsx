import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useDispatch, useSelector } from "react-redux"
import { selectCurrentAccessToken } from "@/store/auth/authSlice"
import { useNavigate } from "react-router-dom"
import { useLogoutMutation } from "@/api/routes/auth"
import { jwtDecode } from "jwt-decode"

export function UserProfile() {
  const navigate = useNavigate()
  const accessToken = useSelector(selectCurrentAccessToken)
  const email = accessToken ? (jwtDecode(accessToken) as any).email : ''
  const [logout, { isLoading, error }] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logout().unwrap()
      navigate("/login")
    } catch (err) {
      console.error('Failed to log out:', err)
    }
  }

  return (
    <Card className="w-64 shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col">
            <p className="text-sm text-gray-500">Logged in as</p>
            <p className="text-sm font-medium text-gray-800 truncate" title={email}>{email}</p>
          </div>
          <Button 
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full text-red-500 border-red-500 hover:bg-red-50"
            disabled={isLoading}
          >
            Log out
          </Button>
          {error && <p className="text-red-500 text-sm">Logout failed. Please try again.</p>}
        </div>
      </CardContent>
    </Card>
  )
}
