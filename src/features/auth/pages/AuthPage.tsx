import { useState, useEffect } from 'react';
import { useAuth } from '@/application/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/presentation/components/ui/enhanced-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs';
import { Package, Users, Shield, ChevronLeft } from 'lucide-react';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const isAdminAuth = searchParams.get('admin') === 'true';
  const defaultTab = searchParams.get('tab') || 'login';
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      // Redirect based on user role when already authenticated
      if (profile.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    }
  }, [user, profile, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error, profile: profileData } = await signIn(loginEmail, loginPassword);
    
    if (!error && profileData) {
      // Redirect based on user role
      if (profileData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const role = isAdminAuth ? 'admin' : 'client';
    const { error } = await signUp(signUpEmail, signUpPassword, firstName, lastName, role);
    
    if (!error) {
      // User will be redirected after email confirmation
    }
    
    setLoading(false);
  };

  const handleGoBack = () => {
    // Smart navigation logic
    const referrer = document.referrer;
    const currentOrigin = window.location.origin;
    
    // If referrer is from same origin, go back in history
    if (referrer && referrer.startsWith(currentOrigin)) {
      navigate(-1);
    } else {
      // Otherwise, redirect to home page
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative">
      {/* Professional back button */}
      <div className="absolute top-0 left-0 w-full z-10">
        <div className="flex justify-start p-4 sm:p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 ease-in-out hover:bg-background/10 backdrop-blur-sm rounded-lg p-3 border border-transparent hover:border-border/20 shadow-sm hover:shadow-md"
            aria-label="Retour à la page précédente"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span className="text-sm font-medium hidden sm:inline">Retour</span>
          </Button>
        </div>
      </div>
      
      <div className="w-full max-w-md mt-16 sm:mt-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {isAdminAuth ? (
              <Shield className="h-10 w-10 text-primary" />
            ) : (
              <Package className="h-10 w-10 text-primary" />
            )}
            <span className="text-2xl font-bold text-foreground">
              Cosumar {isAdminAuth && 'Admin'}
            </span>
          </div>
          <p className="text-muted-foreground">
            {isAdminAuth 
              ? 'Espace d\'administration Cosumar' 
              : 'Votre plateforme de distribution de sucre en ligne'
            }
          </p>
          {!isAdminAuth && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/auth?admin=true')}
                className="text-xs"
              >
                <Shield className="h-4 w-4 mr-2" />
                Espace Administrateur
              </Button>
            </div>
          )}
          {isAdminAuth && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/auth')}
                className="text-xs"
              >
                <Users className="h-4 w-4 mr-2" />
                Espace Client
              </Button>
            </div>
          )}
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>
              {isAdminAuth ? 'Espace Administrateur' : 'Espace Client'}
            </CardTitle>
            <CardDescription>
              {isAdminAuth 
                ? 'Connectez-vous ou créez votre compte administrateur'
                : 'Connectez-vous ou créez votre compte client'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="transition-all duration-200 focus:shadow-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="transition-all duration-200 focus:shadow-md"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="gradient"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">Prénom</Label>
                      <Input
                        id="first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="transition-all duration-200 focus:shadow-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Nom</Label>
                      <Input
                        id="last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="transition-all duration-200 focus:shadow-md"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      className="transition-all duration-200 focus:shadow-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      minLength={6}
                      className="transition-all duration-200 focus:shadow-md"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="gradient"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Inscription...' : "S'inscrire"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
