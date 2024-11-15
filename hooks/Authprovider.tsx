import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../constants/firebaseConfig';

type AuthContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return unsubscribe;
    }, []);

    const logout = async () => {
        await auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
