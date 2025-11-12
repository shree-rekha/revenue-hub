import { BarChart3, TrendingUp, Package, AlertTriangle, Settings, Menu } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const navigation = [
  { name: 'Overview', href: '/', icon: BarChart3 },
  { name: 'Timeline', href: '/timeline', icon: TrendingUp },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Anomalies', href: '/anomalies', icon: AlertTriangle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <>
      {/* Mobile */}
      <MobileSidebar />
      
      {/* Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-border bg-card">
        <SidebarContent />
      </aside>
    </>
  );
}

function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-foreground">Revenue Insights</h1>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Revenue Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">Analytics Hub</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Backend Required</p>
          <p>Connect to FastAPI backend in Settings to view live data.</p>
        </div>
      </div>
    </div>
  );
}
