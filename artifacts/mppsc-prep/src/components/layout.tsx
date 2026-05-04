import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, GraduationCap, LayoutDashboard, BrainCircuit, FileQuestion } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/practice", label: "Practice", icon: GraduationCap },
  { href: "/review", label: "Review Weakness", icon: BookOpen },
  { href: "/questions", label: "Question Bank", icon: FileQuestion },
  { href: "/ai-tutor", label: "AI Tutor", icon: BrainCircuit },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="p-6 border-b border-border flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-3">
            <GraduationCap className="text-primary-foreground" size={24} />
          </div>
          <h1 className="text-xl font-bold text-center leading-tight">MPPSC<br/><span className="text-sm font-medium text-muted-foreground">परीक्षा तैयारी</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                location === item.href
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
           <h1 className="font-bold">MPPSC Prep</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
