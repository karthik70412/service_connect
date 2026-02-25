// src/config/demoCredentials.js

/**
 * Demo Credentials for ServiceConnect Application
 * Use these credentials to access different dashboard roles
 */

export const DEMO_CREDENTIALS = {
    admin: {
        role: 'admin',
        email: 'admin@demo.com',
        password: 'admin123',
        name: 'Admin User',
        description: 'Full access to all administrative features'
    },
    professional: {
        role: 'professional',
        email: 'pro@demo.com',
        password: 'pro123',
        name: 'Professional User',
        description: 'Manage your professional profile and requests'
    },
    user: {
        role: 'user',
        email: 'user@demo.com',
        password: 'user123',
        name: 'Regular User',
        description: 'Find and hire professionals'
    },
    support: {
        role: 'support',
        email: 'support@demo.com',
        password: 'support123',
        name: 'Support Agent',
        description: 'Manage customer support tickets'
    }
};

export const initializeDemoUsers = () => {
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if demo users already exist
    if (existingUsers.length > 0) {
        return;
    }

    // Initialize demo users in localStorage
    const demoUsers = Object.values(DEMO_CREDENTIALS).map(cred => ({
        name: cred.name,
        email: cred.email,
        password: cred.password,
        role: cred.role
    }));

    localStorage.setItem('users', JSON.stringify(demoUsers));
};
