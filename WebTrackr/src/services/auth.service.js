import axios from "axios";

const API = "http://localhost:4567/trackrapi";

export default {
    async login(login, password) {
        try {
            const res = await axios.post(`${API}/auth/signin`, {
                login,
                password,
            });
            return res.data;
        } catch (err) {
            throw err.response.data || err;
        }
    },
};
