import axios from "axios";


export async function axiosGet(url, token) {
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        return new Error('Error fetching data:', error.response ? error.response.data : error.message);
    }
}

export async function axiosPost(url, data, token, type = 'application/json') {
    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': type
            }
        });
        return response.data;
    } catch (error) {
        return new Error('Error fetching data:', error.response ? error.response.data : error.message);
    }
}

export async function axiosPut(url, data, token, type = 'application/json') {
    try {
        const response = await axios.put(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': type
            }
        });
        return response.data;
    } catch (error) {
        return new Error('Error fetching data:', error.response ? error.response.data : error.message);
    }
}


export async function axiosDelete(url, token, type = 'application/json') {
    try {
        const response = await axios.delete(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': type
            }
        });
        return response.data;
    } catch (error) {
        return new Error('Error fetching data:', error.response ? error.response.data : error.message);
    }
}