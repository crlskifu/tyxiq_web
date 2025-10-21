import { useState } from "react";
import { Menu, X, ChevronDown, User, Users, Newspaper, Briefcase, Home, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="glass bg-background bg-opacity-85 shadow-lg sticky top-0 z-20">
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <nav className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-heading font-bold tracking-wider whitespace-nowrap">
              <span className="gradient-text">Tyxiq.web</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="/" active={location === '/'}>
              <Home className="h-4 w-4 mr-1" />
              <span>Home</span>
            </NavLink>
            <NavLink href="/projects" active={location.startsWith('/projects')}>
              <Briefcase className="h-4 w-4 mr-1" />
              <span>Projects</span>
            </NavLink>
            <NavLink href="/news" active={location.startsWith('/news')}>
              <Newspaper className="h-4 w-4 mr-1" />
              <span>News</span>
            </NavLink>
            {user?.role === "admin" && (
              <NavLink href="/users" active={location === '/users'}>
                <Users className="h-4 w-4 mr-1" />
                <span>Users</span>
              </NavLink>
            )}
            
            {/* Account Button */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-card bg-opacity-70 hover:bg-opacity-80 transition">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{user?.username || 'Account'}</span>
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass bg-card bg-opacity-70 border border-border">
                <DropdownMenuItem asChild className="hover:bg-white hover:bg-opacity-10 cursor-pointer">
                  <Link href="/profile" className="flex items-center w-full">
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-white hover:bg-opacity-10 cursor-pointer">
                  <Link href="/profile?tab=settings" className="flex items-center w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="hover:bg-white hover:bg-opacity-10 cursor-pointer"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden focus:outline-none" 
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden glass bg-background bg-opacity-85">
          <div className="px-4 py-3 space-y-4">
            <Link href="/" className="flex items-center py-2 px-3 text-base hover:bg-white hover:bg-opacity-10 rounded-lg">
              <Home className="h-4 w-4 mr-2" /> Home
            </Link>
            <Link href="/projects" className="flex items-center py-2 px-3 text-base hover:bg-white hover:bg-opacity-10 rounded-lg">
              <Briefcase className="h-4 w-4 mr-2" /> Projects
            </Link>
            <Link href="/news" className="flex items-center py-2 px-3 text-base hover:bg-white hover:bg-opacity-10 rounded-lg">
              <Newspaper className="h-4 w-4 mr-2" /> News
            </Link>
            {user?.role === "admin" && (
              <Link href="/users" className="flex items-center py-2 px-3 text-base hover:bg-white hover:bg-opacity-10 rounded-lg">
                <Users className="h-4 w-4 mr-2" /> Users
              </Link>
            )}
            <Link href="/profile" className="flex items-center py-2 px-3 text-base hover:bg-white hover:bg-opacity-10 rounded-lg">
              <User className="h-4 w-4 mr-2" /> My Profile
            </Link>
            <button 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex items-center w-full py-2 px-3 text-base hover:bg-white hover:bg-opacity-10 rounded-lg"
            >
              <LogOut className="h-4 w-4 mr-2" /> 
              {logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ 
  href, 
  children, 
  active = false 
}: { 
  href: string, 
  children: React.ReactNode,
  active?: boolean 
}) {
  return (
    <Link 
      href={href} 
      className={`relative flex items-center text-sm text-gray-200 hover:text-white transition group ${active ? 'text-white' : ''}`}
    >
      {children}
      <span 
        className={`absolute bottom-[-4px] left-0 h-[2px] transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`} 
        style={{ background: 'var(--accent-gradient)' }}></span>
    </Link>
  );
}
