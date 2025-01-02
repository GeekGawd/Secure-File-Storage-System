import { useTotpCreateMutation, useTotpVerifyMutation, useLogoutMutation } from "@/api/routes/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import { Spinner } from "@/components/ui/spinner";
import { useNavigate } from 'react-router-dom';
import { setCredentials, selectCurrentAccessToken } from "@/store/auth/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";

export default function TotpPage() {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [totpCreate, { isLoading, isError }] = useTotpCreateMutation();
    const [totpVerify, { isLoading: isLoadingVerify, isError: isErrorVerify }] = useTotpVerifyMutation();
    const [logout] = useLogoutMutation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const accessToken = useSelector(selectCurrentAccessToken);
    const email = accessToken ? (jwtDecode(accessToken) as any).email : '';

    useEffect(() => {
        (async () => {
            try {
                const response = await totpCreate().unwrap();
                setQrCode(response.data.url);
            } catch (error) {
                console.error('Failed to create TOTP:', error);
            }
        })();
    }, [totpCreate]);

    const handleVerify = async (token: string) => {
        try {
            const response = await totpVerify({ token }).unwrap();

            // Dispatch your action so Redux knows about the new token
            dispatch(setCredentials({ accessToken: response.data.access }));

            // Check if the verify was successful before navigating
            if (response.status) {
                navigate('/home');
            }
        } catch (error) {
            console.error('Failed to verify TOTP:', error);
        }
    }

    const handleBack = async () => {
        try {
            await logout().unwrap();
            navigate('/login');
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">2FA</CardTitle>
                    <p className="text-sm text-gray-500">Logging in as {email}</p>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-4">
                    {isLoading ? (
                        <>
                            <Spinner className="mr-2 h-4 w-4" />
                            Loading QR code...
                        </>
                    ) : qrCode ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <QRCodeSVG value={qrCode} size={256} level="H" />
                            <p className="text-center text-sm text-gray-500">
                                Open your authenticator app and scan the QR code.
                            </p>
                        </div>
                    ) : (
                        <div></div>
                    )}

                    <Input type="text" placeholder="Enter OTP" id="otp-input" />
                    <Button
                        onClick={async () => {
                            const input = document.getElementById('otp-input') as HTMLInputElement;
                            if (input) {
                                await handleVerify(input.value);
                            }
                        }}
                    >
                        Verify
                    </Button>
                    <Button variant="outline" onClick={handleBack}>
                        Back
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}