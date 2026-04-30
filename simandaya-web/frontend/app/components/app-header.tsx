"use client";

import { FormEvent, startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getNavForRole, roleRoutePrefix } from "@/config/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, setCredentials } from "@/store/slices/auth";
import { useLoginMutation, useLogoutMutation } from "@/api/public/auth";
import { resetAllApiState } from "@/store/reset-api-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "./confirm-dialog";
import SharedHeader from "./shared-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AppHeader() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    router.prefetch("/admin");
  }, [mounted, router]);

  const navItems = mounted ? getNavForRole(user?.user_type) : getNavForRole(undefined);

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [postLoginRedirect, setPostLoginRedirect] = useState<string | null>(null);

  const [logoutApi] = useLogoutMutation();
  const [login, { isLoading: loginLoading }] = useLoginMutation();
  const isRouteAllowedForRole = (target: string, roleRoute: string) =>
    target === roleRoute || target.startsWith(`${roleRoute}/`);

  useEffect(() => {
    const onOpenLogin = (event: Event) => {
      if (isAuthenticated) return;
      const detail = (event as CustomEvent<{ targetPath?: string }>).detail;
      setPostLoginRedirect(detail?.targetPath ?? null);
      setLoginUsername("");
      setLoginPassword("");
      setLoginError("");
      setShowLoginDialog(true);
    };
    window.addEventListener("simandaya:open-login", onOpenLogin);
    return () => {
      window.removeEventListener("simandaya:open-login", onOpenLogin);
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } finally {
      resetAllApiState(dispatch);
      dispatch(logout());
      setShowLogoutDialog(false);
      router.push("/general");
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const result = await login({
        username: loginUsername,
        password: loginPassword,
      }).unwrap();

      dispatch(setCredentials({ token: result.access_token, user: result.user }));
      setShowLoginDialog(false);
      setLoginUsername("");
      setLoginPassword("");
      const roleHomeRoute = roleRoutePrefix[result.user.user_type] ?? "/general";
      const targetRoute =
        postLoginRedirect && isRouteAllowedForRole(postLoginRedirect, roleHomeRoute)
          ? postLoginRedirect
          : roleHomeRoute;
      setPostLoginRedirect(null);
      startTransition(() => {
        router.replace(targetRoute);
      });
      // Clear stale RTK Query cache after route transition starts.
      setTimeout(() => {
        resetAllApiState(dispatch);
      }, 0);
    } catch (err: any) {
      setLoginError(err.data?.detail || "Login gagal. Silakan coba lagi.");
    }
  };

  const openLoginDialog = () => {
    setPostLoginRedirect(null);
    setLoginUsername("");
    setLoginPassword("");
    setLoginError("");
    setShowLoginDialog(true);
  };

  const actionLabel = mounted && isAuthenticated ? "Keluar" : "Masuk";
  const onActionClick =
    mounted && isAuthenticated ? () => setShowLogoutDialog(true) : openLoginDialog;

  return (
    <>
      <SharedHeader navItems={navItems} actionLabel={actionLabel} onActionClick={onActionClick} />

      <Dialog
        open={showLoginDialog}
        onOpenChange={(open) => {
          setShowLoginDialog(open);
          if (!open) setPostLoginRedirect(null);
        }}
      >
        <DialogContent
          onInteractOutside={(e: Event) => e.preventDefault()}
          onEscapeKeyDown={() => setShowLoginDialog(false)}
          className="max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Masuk</DialogTitle>
            <DialogDescription>Masuk ke akun Simandaya Anda.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleLogin}>
            {loginError && (
              <div className="rounded-md border border-destructive/25 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{loginError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                type="text"
                autoComplete="username"
                required
                placeholder="Username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                disabled={loginLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                disabled={loginLoading}
              />
            </div>

            <Button type="submit" disabled={loginLoading} className="w-full">
              {loginLoading ? "Memuat..." : "Masuk"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title="Konfirmasi Keluar"
        description="Apakah Anda ingin keluar dari Simandaya?"
        confirmLabel="Ya, Keluar"
        onConfirm={handleLogout}
      />
    </>
  );
}
