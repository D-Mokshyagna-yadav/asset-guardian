import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { mockUsers } from '@/data/mockData';

export default function Login() {
  const [email, setEmail] = useState('john@college.edu');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(true);
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

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>

                  <div className="mt-4 border border-blue-200 rounded-lg overflow-hidden bg-blue-50">
                    <button
                      type="button"
                      onClick={() => setShowCredentials(!showCredentials)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-sm font-semibold text-blue-900">Mock User Credentials</span>
                      {showCredentials ? (
                        <ChevronUp className="h-4 w-4 text-blue-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-blue-600" />
                      )}
                    </button>

                    {showCredentials && (
                      <div className="px-4 py-3 space-y-2 border-t border-blue-200">
                        {[].map((user) => (
                          <div
                            key={user.id}
                            className="text-xs bg-white rounded p-2 cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={() => {
                              setEmail(user.email);
                              setPassword('password');
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-blue-900">{user.name}</span>
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-200 text-blue-800">
                                {user.role === 'SUPER_ADMIN' ? 'Admin' : user.role === 'IT_STAFF' ? 'IT Staff' : 'Department'}
                              </span>
                            </div>
                            <div className="text-blue-700">
                              <div>Email: <span className="font-mono text-blue-900">{user.email}</span></div>
                              <div>Password: <span className="font-mono text-blue-900">password</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
