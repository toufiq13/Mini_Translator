import { User } from "../types/auth";
import { supabase } from "../lib/supabase";

export class AuthService {
  static async signup(email: string, password: string): Promise<string> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("Signup failed");

    return email;
  }

  static async verifyOTP(email: string, token: string): Promise<User> {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) throw error;
    if (!data.user) throw new Error("Verification failed");

    return {
      id: data.user.id,
      email: data.user.email!,
      isVerified: true,
      createdAt: new Date(data.user.created_at).getTime(),
    };
  }

  static async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("Login failed");

    return {
      id: data.user.id,
      email: data.user.email!,
      isVerified: true,
      createdAt: new Date(data.user.created_at).getTime(),
    };
  }

  static async forgotPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  }

  static async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    // For password reset via OTP, we first verify the OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });

    if (verifyError) throw verifyError;

    // Then update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw updateError;
  }

  static async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    return {
      id: session.user.id,
      email: session.user.email!,
      isVerified: true,
      createdAt: new Date(session.user.created_at).getTime(),
    };
  }
}
