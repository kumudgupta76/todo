"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckSquare, AlertCircle, CheckCircle2, Mail, Lock, User, ArrowLeft } from "lucide-react";

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Sign In
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");

  // Forgot password
  const [resetEmail, setResetEmail] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(signInEmail, signInPassword);
    } catch (err: unknown) {
      setError((err as Error).message || "Sign in failed");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (signUpPassword !== signUpConfirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await signUp(signUpEmail, signUpPassword, signUpName || undefined);
    } catch (err: unknown) {
      setError((err as Error).message || "Sign up failed");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError((err as Error).message || "Google sign in failed");
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await resetPassword(resetEmail);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to send reset email");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Desktop Only */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckSquare className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-black">Task Buddy</h1>
          </div>
          <p className="text-lg text-purple-100 mb-8">Your smart companion for getting things done.</p>
          <ul className="space-y-4 text-purple-100">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-purple-200 shrink-0" />
              <span>Organize tasks with agendas & groups</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-purple-200 shrink-0" />
              <span>Rich markdown notes for each task</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-purple-200 shrink-0" />
              <span>Present your tasks in slideshow mode</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-purple-200 shrink-0" />
              <span>Syncs across all your devices</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[hsl(var(--background))]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="h-10 w-10 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center text-white">
              <CheckSquare className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black text-[hsl(var(--foreground))]">Task Buddy</h1>
          </div>

          <Card>
            <CardContent className="p-6">
              {/* Google Button */}
              <Button variant="outline" className="w-full mb-4" onClick={handleGoogleSignIn} disabled={loading}>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[hsl(var(--card))] px-2 text-[hsl(var(--muted-foreground))]">or continue with email</span>
                </div>
              </div>

              {/* Error / Success */}
              {error && (
                <div className="mb-4 p-3 rounded-[var(--radius)] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-center gap-2 text-sm text-red-700 dark:text-red-300 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 rounded-[var(--radius)] bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 flex items-center gap-2 text-sm text-green-700 dark:text-green-300 animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {success}
                </div>
              )}

              {showForgotPassword ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Reset Password</h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Enter your email to receive a reset link.</p>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <Label htmlFor="reset-email">Email</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <Input id="reset-email" type="email" placeholder="you@example.com" className="pl-9" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </form>
                  <button className="mt-4 text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1" onClick={() => { setShowForgotPassword(false); setError(""); setSuccess(""); }}>
                    <ArrowLeft className="h-3 w-3" /> Back to sign in
                  </button>
                </div>
              ) : (
                <Tabs defaultValue="signin">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="signin-email">Email</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                          <Input id="signin-email" type="email" placeholder="you@example.com" className="pl-9" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="signin-password">Password</Label>
                          <button type="button" className="text-xs text-[hsl(var(--primary))] hover:underline" onClick={() => { setShowForgotPassword(true); setError(""); }}>
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative mt-1">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                          <Input id="signin-password" type="password" placeholder="••••••••" className="pl-9" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="signup-name">Name (optional)</Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                          <Input id="signup-name" placeholder="Your name" className="pl-9" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                          <Input id="signup-email" type="email" placeholder="you@example.com" className="pl-9" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative mt-1">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                            <Input id="signup-password" type="password" placeholder="••••••••" className="pl-9" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="signup-confirm">Confirm</Label>
                          <div className="relative mt-1">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                            <Input id="signup-confirm" type="password" placeholder="••••••••" className="pl-9" value={signUpConfirm} onChange={(e) => setSignUpConfirm(e.target.value)} required />
                          </div>
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
