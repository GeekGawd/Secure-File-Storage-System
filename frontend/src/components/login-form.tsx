import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLoginMutation, LoginCredentials } from "@/api/routes/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { selectCurrentAccessToken, setCredentials } from "@/store/auth/authSlice"
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LoginRedirect, JwtTokenObtainPair } from "@/api/routes/auth";
import { ApiResponse } from "@/api";
import { useEffect } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accessToken = useSelector(selectCurrentAccessToken);

  // // Move the redirect logic into useEffect
  // useEffect(() => {
  //   if (accessToken) {
  //     navigate("/totp");
  //   }
  // }, [accessToken, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const { email: emailInput, password } = Object.fromEntries(formData) as { email: string, password: string };
    try {
      const response = await login({ email: emailInput, password: password }).unwrap();
      if (response.status_code === 302) {
        const data = response.data as LoginRedirect;
        navigate(data.redirect_url);
        return;
      }

      const { data: { access } } = response as ApiResponse<JwtTokenObtainPair>;
      dispatch(setCredentials({
        user: emailInput,
        accessToken: access,
      }));

      navigate("/totp");
      // red
    }
    catch (error) {
      console.log("error", error);
      // Error will be handled by the error state
    }
  }

  // Function to extract error message
  const getErrorMessage = () => {
    if ('data' in error!) {
      return (error.data as { message: string })?.message ?? "An unexpected error occurred.";
    }
    return "An unexpected error occurred.";
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleLogin} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your account
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>
                    {getErrorMessage()}
                  </AlertDescription>
                </Alert>
              )}

              {/* Email Input */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  name="email"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" name="password" required />
              </div>

              {/* Login Button with Spinner */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>



              {/* Sign Up Link */}
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="/register" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </div>
          </form>

          {/* Image Section */}
          <div className="relative hidden bg-muted md:block">
            <img
              src="src/assets/chill-guy-background.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

    </div>
  )
}