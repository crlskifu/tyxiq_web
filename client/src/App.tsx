import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { useEffect, useState } from "react";
import NewsPage from "@/pages/NewsPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProfilePage from "@/pages/ProfilePage";
import UsersPage from "@/pages/UsersPage";
import NewsDetailPage from "@/pages/NewsDetailPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import NewsCreatePage from "@/pages/NewsCreatePage";
import NewsEditPage from "@/pages/NewsEditPage";
import ProjectCreatePage from "@/pages/ProjectCreatePage";
import ProjectEditPage from "@/pages/ProjectEditPage";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      {/* Маршруты новостей */}
      <ProtectedRoute path="/news" component={NewsPage} />
      <ProtectedRoute path="/news/create" component={NewsCreatePage} />
      <ProtectedRoute path="/news/edit/:id" component={NewsEditPage} />
      <ProtectedRoute path="/news/:id" component={NewsDetailPage} />
      {/* Маршруты проектов */}
      <ProtectedRoute path="/projects" component={ProjectsPage} />
      <ProtectedRoute path="/projects/create" component={ProjectCreatePage} />
      <ProtectedRoute path="/projects/edit/:id" component={ProjectEditPage} />
      <ProtectedRoute path="/projects/:id" component={ProjectDetailPage} />
      {/* Другие маршруты */}
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [accentColors, setAccentColors] = useState<string[]>([]);

  // Generate random accent colors
  const generateRandomColors = () => {
    const getRandomColor = () => {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 70 + Math.floor(Math.random() * 30);
      const lightness = 50 + Math.floor(Math.random() * 20);
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    const colors = [getRandomColor(), getRandomColor(), getRandomColor()];
    setAccentColors(colors);
    document.documentElement.style.setProperty('--accent-gradient', `linear-gradient(45deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`);
  };

  // Generate colors on initial load and then every 30 seconds
  useEffect(() => {
    generateRandomColors();
    const intervalId = setInterval(generateRandomColors, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen relative">
          <Router />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
