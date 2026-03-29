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
import RegisterModal from "./register-modal";
import SharedHeader from "./shared-header";

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
    router.prefetch("/guru");
    router.prefetch("/siswa");
  }, [mounted, router]);

  const navItems = mounted ? getNavForRole(user?.user_type) : getNavForRole(undefined);

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [logoutApi] = useLogoutMutation();
  const [login, { isLoading: loginLoading }] = useLoginMutation();

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
      const targetRoute = roleRoutePrefix[result.user.user_type] ?? "/general";
      startTransition(() => {
        router.replace(targetRoute);
      });
      // Clear stale RTK Query cache after route transition starts to avoid blocking redirect.
      setTimeout(() => {
        resetAllApiState(dispatch);
      }, 0);
    } catch (err: any) {
      setLoginError(err.data?.detail || "Login gagal. Silakan coba lagi.");
    }
  };

  const openLoginDialog = () => {
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
      <SharedHeader
        navItems={navItems}
        actionLabel={actionLabel}
        onActionClick={onActionClick}
      />

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent
          onInteractOutside={(e: Event) => e.preventDefault()}
          onEscapeKeyDown={() => setShowLoginDialog(false)}
        >
          <DialogHeader>
            <DialogTitle>Masuk</DialogTitle>
            <DialogDescription>Masuk ke akun Simandaya Anda.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleLogin}>
            {loginError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{loginError}</p>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="login-username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                required
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                disabled={loginLoading}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="login-password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                disabled={loginLoading}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? "Memuat..." : "Masuk"}
            </button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <button
              type="button"
              onClick={() => {
                setShowLoginDialog(false);
                setShowRegisterDialog(true);
              }}
              className="text-primary font-medium hover:underline"
            >
              Daftar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <RegisterModal
        open={showRegisterDialog}
        onOpenChange={setShowRegisterDialog}
        onSwitchToLogin={() => {
          setShowRegisterDialog(false);
          openLoginDialog();
        }}
      />

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
