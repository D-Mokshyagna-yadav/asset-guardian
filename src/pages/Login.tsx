import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockUsers } from '@/data/mockData';
import { Server, AlertCircle, Copy, Check } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

      const handleCopyEmail = (userEmail: string) => {
        void navigator.clipboard.writeText(userEmail);
        setCopiedEmail(userEmail);
        setTimeout(() => setCopiedEmail(null), 2000);
      };
    
      // Group users by role
      const usersByRole = mockUsers.reduce<Record<string, typeof mockUsers>>((acc, user) => {
        const role = user.role || 'UNKNOWN';
        if (!acc[role]) acc[role] = [] as any;
        acc[role].push(user as any);
        return acc;
      }, {} as Record<string, typeof mockUsers>);
    
      const roleOrder = ['SUPER_ADMIN', 'IT_STAFF', 'DEPARTMENT_INCHARGE'];
      const sortedRoles = roleOrder.filter((role) => Boolean(usersByRole[role]));
    
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="w-full max-w-md animate-fade-in">
            <div className="flex flex-col items-center mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
                <Server className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">ITSS Manager</h1>
              <p className="text-muted-foreground mt-1">Device Inventory System</p>
            </div>

            <Card className="border-border shadow-lg">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl text-center">Sign in</CardTitle>
                <CardDescription className="text-center">Enter your credentials to access the system</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="h-11"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">Demo Credentials (Password: demo123 for all)</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : 'Sign in'}
                    </Button>
                  </div>
                </form>

                {/* Demo Credentials List */}
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center mb-3">Demo Credentials</p>
                  <div className="space-y-3 text-xs max-h-72 overflow-y-auto">
                    {sortedRoles.map((role) => {
                      const roleLabel = role
                        .split('_')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');

                      return (
                        <div key={role} className="space-y-2">
                          <div className="text-xs font-semibold text-primary px-2 py-1 rounded bg-primary/10">{roleLabel}</div>
                          {usersByRole[role]?.map((user: any) => (
                            <div key={user.id} className="p-3 rounded bg-muted/50 border border-border/50 hover:border-border transition">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">{user.name}</p>
                                  <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{user.email}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEmail(user.email);
                                      setPassword('demo123');
                                    }}
                                    className="px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 transition text-xs font-medium whitespace-nowrap"
                                    type="button"
                                  >
                                    Use
                                  </button>
                                  <button
                                    onClick={() => handleCopyEmail(user.email)}
                                    className="px-2 py-1 rounded bg-muted/20 hover:bg-muted/30 transition text-xs"
                                    type="button"
                                    aria-label={`Copy ${user.email}`}
                                  >
                                    {copiedEmail === user.email ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                              {user.departmentId && <p className="text-xs text-muted-foreground">Dept: {user.departmentId}</p>}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
            </div>
          );
    }
