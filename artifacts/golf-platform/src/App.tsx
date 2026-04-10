import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { setBaseUrl } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Scores from "@/pages/Scores";
import Draws from "@/pages/Draws";
import Profile from "@/pages/Profile";
import Charities from "@/pages/Charities";
import CharityDetail from "@/pages/CharityDetail";
import HowItWorks from "@/pages/HowItWorks";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminDraws from "@/pages/admin/AdminDraws";
import AdminCharities from "@/pages/admin/AdminCharities";
import AdminWinners from "@/pages/admin/AdminWinners";
import { useLocation } from "wouter";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    } else if (adminOnly && !isAdmin) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isAdmin, adminOnly, setLocation]);

  if (!isAuthenticated) return null;
  if (adminOnly && !isAdmin) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/charities" component={Charities} />
      <Route path="/charities/:id" component={CharityDetail} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/scores">
        {() => <ProtectedRoute component={Scores} />}
      </Route>
      <Route path="/draws">
        {() => <ProtectedRoute component={Draws} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} adminOnly />}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute component={AdminUsers} adminOnly />}
      </Route>
      <Route path="/admin/draws">
        {() => <ProtectedRoute component={AdminDraws} adminOnly />}
      </Route>
      <Route path="/admin/charities">
        {() => <ProtectedRoute component={AdminCharities} adminOnly />}
      </Route>
      <Route path="/admin/winners">
        {() => <ProtectedRoute component={AdminWinners} adminOnly />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Set API base URL
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "/api";
    setBaseUrl(apiUrl);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
