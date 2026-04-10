import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, LayoutDashboard, Trophy, Heart, Settings, Shield } from "lucide-react";
import { motion } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [location] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync({});
    logout();
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/charities", label: "Charities" },
    { href: "/how-it-works", label: "How It Works" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-bold text-lg text-foreground">Par for Purpose</span>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors ${
                    location === link.href
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="hidden md:flex">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-3 h-3 text-primary" />
                        </div>
                        <span className="hidden md:block max-w-24 truncate">{user?.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/scores" className="flex items-center gap-2 cursor-pointer">
                          <Trophy className="w-4 h-4" /> My Scores
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="w-4 h-4" /> Profile
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="flex items-center gap-2 cursor-pointer text-accent">
                              <Shield className="w-4 h-4" /> Admin Panel
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      Subscribe Now
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-display font-bold text-foreground">Par for Purpose</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Where every score supports a cause. Play, win, and make a difference.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Platform</h3>
              <ul className="space-y-2">
                <li><Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How It Works</Link></li>
                <li><Link href="/charities" className="text-sm text-muted-foreground hover:text-foreground">Charities</Link></li>
                <li><Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">Subscribe</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Account</h3>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Login</Link></li>
                <li><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link></li>
                <li><Link href="/scores" className="text-sm text-muted-foreground hover:text-foreground">My Scores</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              &copy; 2026 Par for Purpose. A charitable golf subscription platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
