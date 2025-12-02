import axios from "axios";
const API = "http://localhost:4567/trackrapi";

export default {
    async getMeasures(moduleKey = null) {
        const url = moduleKey
            ? `${API}/measure/get?key=${moduleKey}`
            : `${API}/measure/get`;

        const res = await axios.get(url);
        return res.data.data;
    },
};
