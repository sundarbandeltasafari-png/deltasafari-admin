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
        if (error.response && error.response.data) {
            return error.response.data;
        }
        return { status: false, msg: error.message || 'Error fetching data' };
    }
}

export async function axiosPost(url, data, token, type = 'application/json') {
    try {
        const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        if (!isFormData && type) {
            headers['Content-Type'] = type;
        } else if (isFormData && type && type !== 'application/json' && type !== 'multipart/form-data') {
            headers['Content-Type'] = type;
        }
        const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            return error.response.data;
        }
        return { status: false, msg: error.message || 'Error posting data' };
    }
}

export async function axiosPut(url, data, token, type = 'application/json') {
    try {
        const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        if (!isFormData && type) {
            headers['Content-Type'] = type;
        } else if (isFormData && type && type !== 'application/json' && type !== 'multipart/form-data') {
            headers['Content-Type'] = type;
        }
        const response = await axios.put(url, data, { headers });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            return error.response.data;
        }
        return { status: false, msg: error.message || 'Error updating data' };
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
        if (error.response && error.response.data) {
            return error.response.data;
        }
        return { status: false, msg: error.message || 'Error deleting data' };
    }
}