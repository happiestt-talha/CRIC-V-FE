import axiosInstance from './axios'
import Cookies from 'js-cookie'

export const authApi = {
    async login(username, password) {
        const formData = new URLSearchParams()
        formData.append('username', username)
        formData.append('password', password)

        const response = await axiosInstance.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })

        const { access_token } = response.data
        Cookies.set('access_token', access_token, { expires: 1 })

        return response.data
    },

    async register(userData) {
        const response = await axiosInstance.post('/auth/register', userData)
        return response.data
    },

    async logout() {
        try {
            await axiosInstance.post('/auth/logout')
        } finally {
            Cookies.remove('access_token')
            Cookies.remove('refresh_token')
        }
    },

    async getMe() {
        const response = await axiosInstance.get('/auth/me')
        return response.data
    },

    async verifyToken() {
        const response = await axiosInstance.get('/auth/verify')
        return response.data
    },

    async refreshToken() {
        const response = await axiosInstance.post('/auth/refresh')
        const { access_token } = response.data
        Cookies.set('access_token', access_token, { expires: 1 })
        return response.data
    },
}