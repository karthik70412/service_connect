import API from './axiosConfig';

const requestService = {
    createRequest: async (requestData) => {
        try {
            const { userName, professionalName, bookingDate, bookingTime, address, note } = requestData;

            // Validate required fields before sending
            if (!userName) throw new Error('userName is required');
            if (!professionalName) throw new Error('professionalName is required');
            if (!bookingDate) throw new Error('bookingDate is required');
            if (!bookingTime) throw new Error('bookingTime is required');
            if (!address) throw new Error('address is required');

            const payload = {
                userName,
                professionalName,
                bookingDate,
                bookingTime,
                address,
                note: note || ''
            };

            console.log('🔵 requestService: Sending POST to /api/requests with payload:', payload);

            const response = await API.post('/api/requests', payload);
            
            console.log('🟢 requestService: Response received:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('🔴 requestService.createRequest ERROR');
            console.error('Request data:', requestData);
            console.error('Error type:', error.code || error.name);
            console.error('Error message:', error.message);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            console.error('Full error:', error);
            throw error;
        }
    },

    getUserRequests: async (userName) => {
        try {
            if (!userName) {
                console.warn('requestService.getUserRequests: userName is empty');
                return [];
            }
            
            console.log('🔵 requestService: Fetching user requests for:', userName);
            const response = await API.get(`/api/requests/user/${encodeURIComponent(userName)}`);
            
            console.log('🟢 requestService: User requests received:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('🔴 requestService.getUserRequests ERROR for user:', userName);
            console.error('Error:', error.message);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            throw error;
        }
    },

    getProfessionalRequests: async (professionalName) => {
        try {
            if (!professionalName) {
                console.warn('requestService.getProfessionalRequests: professionalName is empty');
                return [];
            }
            
            console.log('🔵 requestService: Fetching professional requests for:', professionalName);
            const response = await API.get(`/api/requests/professional/${encodeURIComponent(professionalName)}`);
            
            console.log('🟢 requestService: Professional requests received:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('🔴 requestService.getProfessionalRequests ERROR for professional:', professionalName);
            console.error('Error:', error.message);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            throw error;
        }
    },

    updateRequestStatus: async (requestId, status) => {
        try {
            if (!requestId) throw new Error('requestId is required');
            if (!status) throw new Error('status is required');
            
            console.log('🔵 requestService: Updating request', requestId, 'to status:', status);
            const response = await API.put(`/api/requests/${requestId}?status=${encodeURIComponent(status)}`);
            
            console.log('🟢 requestService: Request updated:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('🔴 requestService.updateRequestStatus ERROR');
            console.error('Request ID:', requestId);
            console.error('Status:', status);
            console.error('Error:', error.message);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            throw error;
        }
    },
};

export default requestService;
