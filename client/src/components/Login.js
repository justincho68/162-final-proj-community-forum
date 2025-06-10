// Login.js - New React login component
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true); // true = login, false = signup
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get redirect destination from navigation state, default to home
    const redirectTo = location.state?.redirectTo || '/';

    // If user is already logged in, redirect them
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('User already logged in, redirecting...');
                navigate(redirectTo);
            }
        });
        
        return () => unsubscribe();
    }, [navigate, redirectTo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                // Login existing user
                await signInWithEmailAndPassword(auth, email, password);
                console.log('Login successful!');
            } else {
                // Create new user
                await createUserWithEmailAndPassword(auth, email, password);
                console.log('Account created successfully!');
            }
            
            // Redirect after successful authentication
            navigate(redirectTo);
            
        } catch (error) {
            console.error('Auth error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            console.log('Google login successful!');
            
            // Redirect after successful authentication
            navigate(redirectTo);
            
        } catch (error) {
            console.error('Google login error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="login-subtitle">
                    {isLogin ? 'Sign in to your account' : 'Join The Davis Bulletin'}
                </p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <input 
                            type="email" 
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <input 
                            type="password" 
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div className="divider">
                    <span>or</span>
                </div>

                <button 
                    onClick={handleGoogleLogin}
                    className="google-button"
                    disabled={loading}
                >
                    {loading ? 'Please wait...' : 'Continue with Google'}
                </button>

                <div className="toggle-mode">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button 
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="toggle-button"
                            disabled={loading}
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>

                <div className="back-to-home">
                    <button 
                        onClick={() => navigate('/')}
                        className="back-button"
                        disabled={loading}
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;