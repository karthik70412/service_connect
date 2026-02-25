import { createContext, useContext, useState, useEffect } from 'react';
import { professionals as initialProfessionals, mockRequests as initialRequests, mockComplaints as initialComplaints, serviceCategories as initialCategories, users as initialUsers } from '../data/mockData';
import { initializeDemoUsers } from '../config/demoCredentials';

const AppContext = createContext(null);

export function AppProvider({ children }) {
    // Initialize role from localStorage on app startup
    const [role, setRole] = useState(() => {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                return user.isLoggedIn ? user.role : null;
            } catch (e) {
                console.error('Failed to parse currentUser from localStorage:', e);
                return null;
            }
        }
        return null;
    });

    // Initialize demo users and restore user session on app startup
    useEffect(() => {
        initializeDemoUsers();
        
        // Restore user session if exists
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                if (user.isLoggedIn && user.role) {
                    setRole(user.role);
                }
            } catch (e) {
                console.error('Failed to restore user session:', e);
            }
        }
    }, []);

    const [professionals, setProfessionals] = useState(() => {
        const storedProfessionals = localStorage.getItem('professionals');
        if (storedProfessionals) {
            try {
                return JSON.parse(storedProfessionals);
            } catch (e) {
                console.error('Failed to parse professionals from localStorage:', e);
                return initialProfessionals;
            }
        }
        return initialProfessionals;
    });
    
    // Save professionals to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('professionals', JSON.stringify(professionals));
    }, [professionals]);

    const [requests, setRequests] = useState(initialRequests);
    const [complaints, setComplaints] = useState(initialComplaints);
    const [serviceCategories, setServiceCategories] = useState(initialCategories);
    
    // Initialize users from localStorage or mockData
    const [users, setUsers] = useState(() => {
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
            try {
                return JSON.parse(storedUsers);
            } catch (e) {
                console.error('Failed to parse users from localStorage:', e);
                return initialUsers;
            }
        }
        return initialUsers;
    });

    // Listen for changes to localStorage users and update state
    useEffect(() => {
        const handleStorageChange = () => {
            const storedUsers = localStorage.getItem('users');
            if (storedUsers) {
                try {
                    setUsers(JSON.parse(storedUsers));
                } catch (e) {
                    console.error('Failed to parse users from localStorage:', e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Professional profile (for the logged-in professional)
    const [professionalProfile, setProfessionalProfile] = useState(initialProfessionals[0]);

    // Hire a professional (User action)
    const hireRequest = (professional, service) => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const newRequest = {
            id: requests.length + 1,
            userId: currentUser.userId || 99,
            userName: currentUser.fullName || 'You',
            professionalId: professional.id,
            professionalName: professional.name,
            service,
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            address: 'Your Location',
        };
        setRequests(prev => [newRequest, ...prev]);
    };

    // Professional accepts/rejects a request
    const updateRequestStatus = (id, status) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    };

    // Support resolves a complaint
    const resolveComplaint = (id) => {
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c));
    };

    // Admin adds/removes category
    const addCategory = (category) => {
        setServiceCategories(prev => [...prev, { ...category, id: prev.length + 1 }]);
    };
    const removeCategory = (id) => {
        setServiceCategories(prev => prev.filter(c => c.id !== id));
    };

    // Professional updates own profile
    const updateProfile = (data) => {
        setProfessionalProfile(prev => ({ ...prev, ...data }));
        setProfessionals(prev => prev.map(p => p.id === professionalProfile.id ? { ...p, ...data } : p));
        // Update professional name in all existing requests
        if (data.name && data.name !== professionalProfile.name) {
            setRequests(prev => prev.map(r => 
                r.professionalId === professionalProfile.id 
                    ? { ...r, professionalName: data.name }
                    : r
            ));
        }
    };

    // Add service to professional's profile
    const addService = (service) => {
        setProfessionalProfile(prev => ({ ...prev, services: [...(prev.services || []), service] }));
        // Also update in the professionals array
        setProfessionals(prev => prev.map(p => 
            p.id === professionalProfile.id 
                ? { ...p, services: [...(p.services || []), service] }
                : p
        ));
    };

    // Logout function - clear session from localStorage
    const logout = () => {
        localStorage.removeItem('currentUser');
        setRole(null);
    };

    // Update role and persist to localStorage
    const updateRole = (newRole) => {
        setRole(newRole);
        if (newRole) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            currentUser.role = newRole;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    };

    // Sync users from localStorage (useful when new users register)
    const syncUsers = () => {
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
            try {
                setUsers(JSON.parse(storedUsers));
            } catch (e) {
                console.error('Failed to sync users from localStorage:', e);
            }
        }
    };

    // Update professional stats after rating submission
    const submitProfessionalRating = (professionalId, ratingValue) => {
        setProfessionals(prev => prev.map(p => {
            if (p.id === professionalId) {
                const newReviews = (p.reviews || 0) + 1;
                const currentRating = p.rating || 5.0;
                // Calculate new average rating
                const newRating = (currentRating * (newReviews - 1) + ratingValue) / newReviews;
                return {
                    ...p,
                    rating: parseFloat(newRating.toFixed(1)),
                    reviews: newReviews,
                    completedJobs: (p.completedJobs || 0) + 1,
                };
            }
            return p;
        }));
    };

    const value = {
        role, setRole: updateRole,
        professionals, setProfessionals,
        requests, setRequests,
        complaints, setComplaints,
        serviceCategories, setServiceCategories,
        users, setUsers,
        professionalProfile, setProfessionalProfile,
        hireRequest,
        updateRequestStatus,
        submitProfessionalRating,
        resolveComplaint,
        addCategory,
        removeCategory,
        updateProfile,
        addService,
        logout,
        syncUsers,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
