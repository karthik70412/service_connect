import { createContext, useContext, useState, useEffect } from 'react';
import { professionals as initialProfessionals, mockComplaints as initialComplaints, serviceCategories as initialCategories, users as initialUsers } from '../data/mockData';
import { initializeDemoUsers } from '../config/demoCredentials';
import supportService from '../api/supportService';
import requestService from '../api/requestService';

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

    const [requests, setRequests] = useState([]);
    const [complaints, setComplaints] = useState(initialComplaints);
    const [serviceCategories, setServiceCategories] = useState(initialCategories);
    const [supportRequests, setSupportRequests] = useState([]);
    
    // Load support tickets from backend
    useEffect(() => {
        const loadSupportTickets = async () => {
            try {
                const tickets = await supportService.getSupportTickets();
                setSupportRequests(Array.isArray(tickets) ? tickets : []);
            } catch (error) {
                console.error('Failed to load support tickets:', error);
            }
        };
        loadSupportTickets();
    }, []);

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

    const getCurrentUserName = () => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return currentUser.name || currentUser.fullName || currentUser.userName || currentUser.email || 'You';
    };

    // Hire a professional (User action)
    const hireRequest = async (userName, professionalName, bookingDate, bookingTime, address, note) => {
        console.log('📋 AppContext.hireRequest called with:', {
            userName,
            professionalName,
            bookingDate,
            bookingTime,
            address,
            noteLength: note?.length || 0
        });

        // Validate inputs
        if (!userName) {
            console.error('❌ hireRequest: userName is missing');
            throw new Error('Username is required to create a booking request');
        }
        if (!professionalName) {
            console.error('❌ hireRequest: professionalName is missing');
            throw new Error('Professional name is required to create a booking request');
        }
        if (!bookingDate) {
            console.error('❌ hireRequest: bookingDate is missing');
            throw new Error('Booking date is required');
        }
        if (!bookingTime) {
            console.error('❌ hireRequest: bookingTime is missing');
            throw new Error('Booking time is required');
        }
        if (!address) {
            console.error('❌ hireRequest: address is missing');
            throw new Error('Address is required');
        }

        const payload = {
            userName: userName || getCurrentUserName(),
            professionalName,
            bookingDate,
            bookingTime,
            address,
            note: note || ''
        };

        console.log('📤 AppContext.hireRequest: Creating payload for backend:', payload);

        try {
            const createdRequest = await requestService.createRequest({
                userName: payload.userName,
                professionalName: payload.professionalName,
                bookingDate: payload.bookingDate,
                bookingTime: payload.bookingTime,
                address: payload.address,
                note: payload.note
            });

            console.log('✅ AppContext.hireRequest: Backend response received:', createdRequest);

            const status = createdRequest.status?.toLowerCase() || 'pending';
            const newRequest = {
                ...createdRequest,
                id: createdRequest.id || createdRequest._id || Date.now(),
                userName: payload.userName,
                professionalName,
                bookingDate: payload.bookingDate,
                bookingTime: payload.bookingTime,
                address: payload.address,
                note: payload.note,
                status,
            };

            console.log('📌 AppContext.hireRequest: Adding request to local state:', newRequest);
            setRequests(prev => [newRequest, ...prev]);
            return newRequest;
        } catch (error) {
            console.error('❌ AppContext.hireRequest FAILED');
            console.error('Error:', error.message);
            throw error;
        }
    };
    const normalizeRequest = (ticket) => ({
        ...ticket,
        status: ticket.status?.toLowerCase() || 'pending',
    });

    const updateRequestStatus = async (id, status) => {
        const updatedRequest = await requestService.updateRequestStatus(id, status);
        const normalized = normalizeRequest({ ...updatedRequest, status });
        setRequests(prev => prev.map(r => r.id === id ? { ...r, ...normalized } : r));
        return normalized;
    };

    const fetchUserRequests = async (userName) => {
        if (!userName) return [];
        const userRequests = await requestService.getUserRequests(userName);
        const normalizedRequests = Array.isArray(userRequests) ? userRequests.map(normalizeRequest) : [];
        setRequests(normalizedRequests);
        return normalizedRequests;
    };

    const fetchProfessionalRequests = async (professionalName) => {
        console.log('🔵 AppContext.fetchProfessionalRequests: Fetching for professional:', professionalName);
        
        if (!professionalName) {
            console.warn('⚠️ AppContext.fetchProfessionalRequests: Missing professional name');
            return [];
        }
        
        try {
            const professionalRequests = await requestService.getProfessionalRequests(professionalName);
            console.log('📦 AppContext.fetchProfessionalRequests: Raw response:', professionalRequests);
            
            const normalizedRequests = Array.isArray(professionalRequests) 
                ? professionalRequests.map(req => {
                    const normalized = normalizeRequest(req);
                    console.log('✅ AppContext.fetchProfessionalRequests: Normalized request:', {
                        id: normalized.id,
                        userName: normalized.userName,
                        professionalName: normalized.professionalName,
                        bookingDate: normalized.bookingDate,
                        bookingTime: normalized.bookingTime,
                        address: normalized.address,
                        note: normalized.note,
                        status: normalized.status
                    });
                    return normalized;
                })
                : [];
            
            console.log('🟢 AppContext.fetchProfessionalRequests: Setting requests, total count:', normalizedRequests.length);
            setRequests(normalizedRequests);
            return normalizedRequests;
        } catch (error) {
            console.error('🔴 AppContext.fetchProfessionalRequests: ERROR fetching requests for', professionalName);
            console.error('Error:', error.message);
            throw error;
        }
    };

    const normalizePriority = (priority) => {
        if (!priority) return 'Medium';
        return `${priority.charAt(0).toUpperCase()}${priority.slice(1).toLowerCase()}`;
    };

    // User submits a support request
    const submitSupportRequest = async (ticket) => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userName = currentUser.name || currentUser.fullName || currentUser.userName || currentUser.email || 'You';
        const payload = {
            userName,
            subject: ticket.subject,
            category: ticket.category,
            priority: normalizePriority(ticket.priority),
            description: ticket.description,
        };

        const createdTicket = await supportService.createSupportTicket(payload);
        const newTicket = {
            ...createdTicket,
            userId: currentUser.userId || 99,
            userName,
            status: createdTicket.status || 'open',
            date: createdTicket.date || new Date().toISOString().split('T')[0],
        };
        setSupportRequests(prev => [newTicket, ...prev]);
        return newTicket;
    };

    // Support resolves a user support request
    const resolveSupportRequest = (id) => {
        setSupportRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
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
        supportRequests, setSupportRequests,
        serviceCategories, setServiceCategories,
        users, setUsers,
        professionalProfile, setProfessionalProfile,
        hireRequest,
        updateRequestStatus,
        fetchUserRequests,
        fetchProfessionalRequests,
        submitProfessionalRating,
        resolveComplaint,
        addCategory,
        removeCategory,
        updateProfile,
        addService,
        logout,
        syncUsers,
        submitSupportRequest,
        resolveSupportRequest,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
