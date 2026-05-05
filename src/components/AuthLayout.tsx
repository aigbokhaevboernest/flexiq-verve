import { Link } from "react-router-dom";
import { ReactNode } from "react";

export const AuthLayout = ({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) => (
  <div className="grid min-h-screen lg:grid-cols-2">
    {/* Left: form */}
    <div className="flex flex-col px-6 py-8 sm:px-10">
      <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
          <img src="/logo.png" alt="Logo" className="h-5 w-5" />
        </span>
        Flexiq Verve
      </Link>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
      </div>

      <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Norvex Financial</p>
    </div>

    {/* Right: hero panel */}
    <div className="relative hidden overflow-hidden bg-gradient-primary lg:block">
      <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
      <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />
      <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-success" />
          Trusted by 1.2M+ members
        </div>
        <div>
          <p className="font-display text-4xl font-bold leading-tight">
            Banking that <span className="block opacity-70">moves at your pace.</span>
          </p>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Open an account in minutes and unlock smart tools to save, send and grow your money.
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="font-display text-2xl font-bold">4.5%</p>
            <p className="text-primary-foreground/70">APY savings</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold">$0</p>
            <p className="text-primary-foreground/70">Monthly fees</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold">24/7</p>
            <p className="text-primary-foreground/70">Live support</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
