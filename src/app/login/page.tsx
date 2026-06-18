"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex bg-[#f3f2f2] font-sans overflow-y-auto">
      {/* Left Hero Panel */}
      <div className="hidden md:flex flex-[1.1] min-w-0 bg-gradient-to-br from-[#cf181f] via-[#9d0f14] to-[#231f20] text-white p-14 flex-col justify-between relative overflow-hidden">
        {/* Decorative circle background */}
        <div className="absolute -right-[120px] -bottom-[120px] w-[360px] h-[360px] rounded-full bg-white/5 pointer-events-none" />

        <div>
          <div className="rounded-2xl bg-white shadow-xl px-5 py-4 inline-block">
            <Image
              src="/vs-logo.png"
              alt="Vikram Solar Logo"
              width={220}
              height={56}
              className="object-contain h-[56px] w-auto"
              priority
              unoptimized
            />
          </div>
        </div>

        <div className="relative z-10 my-8">
          <h1 className="text-[38px] leading-[1.1] font-bold tracking-tight mb-4">V-Legal</h1>
          <p className="text-[14.5px] leading-relaxed text-white/85 max-w-[420px]">
            Secure litigation & legal-spend tracking for Vikram Solar. Matters, hearings, invoices, documents and notices — in one shared, live workspace.
          </p>
        </div>

        <div className="relative z-10">
          <div className="text-[20px] font-bold">Vikram <span className="opacity-85">Solar</span></div>
          <div className="text-[9.5px] tracking-[0.18em] uppercase text-white/70 mt-0.5">Creating Climate for Change</div>
          <div className="text-[11px] text-white/60 flex items-center gap-1.5 mt-4">
            <Lock className="w-3.5 h-3.5 opacity-70" />
            Protected by enterprise-grade authentication
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 min-w-0 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-[372px]">

          {/* Mobile Logo Only */}
          <div className="md:hidden flex flex-col items-start gap-3 mb-8">
            <div className="rounded-xl bg-white border border-gray-100 shadow-sm px-4 py-2.5 inline-block">
              <Image
                src="/vs-logo.png"
                alt="Vikram Solar Logo"
                width={180}
                height={40}
                className="object-contain h-[40px] w-auto"
                priority
                unoptimized
              />
            </div>
            <div>
              <div className="text-[#231f20] font-bold text-xl">V-Legal</div>
              <div className="text-gray-500 text-sm">Vikram Solar</div>
            </div>
          </div>

          <h2 className="text-[22px] font-bold text-[#231f20] tracking-tight">Sign in</h2>
          <div className="text-[13px] text-[#4a4648] mt-1.5 mb-6 leading-relaxed">
            Access your V-Legal dashboard securely.
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4a4648] block mb-1.5">
              Email Address
            </label>
            <div className="relative mb-4">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register("email")}
                type="email"
                placeholder="admin@vikramsolar.com"
                disabled={loading}
                className="w-full pl-[38px] pr-3 py-[11px] border border-[#00000021] rounded-lg text-[14px] text-[#231f20] outline-none transition-colors bg-white focus:border-[#cf181f] focus:ring-2 focus:ring-[#cf181f]/10"
              />
              {errors.email && <p className="text-[#cf181f] text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#4a4648] block mb-1.5">
              Password
            </label>
            <div className="relative mb-6">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register("password")}
                type="password"
                placeholder="Your password"
                disabled={loading}
                className="w-full pl-[38px] pr-3 py-[11px] border border-[#00000021] rounded-lg text-[14px] text-[#231f20] outline-none transition-colors bg-white focus:border-[#cf181f] focus:ring-2 focus:ring-[#cf181f]/10"
              />
              {errors.password && <p className="text-[#cf181f] text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-[12px] rounded-lg bg-[#cf181f] hover:bg-[#a8121a] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
              ) : (
                "Continue"
              )}
            </button>
          </form>

          <div className="text-[11px] text-[#8b8589] leading-relaxed mt-5 pt-5 border-t border-[#00000012]">
            <b>Secure Gateway:</b> This is a private enterprise application restricted to authorized Vikram Solar personnel only.
          </div>

        </div>
      </div>
    </div>
  );
}
