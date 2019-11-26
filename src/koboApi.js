import config from "./config";

export default {
    urls() {
        return {
            login: `${config.backendUrl}/koboApi/api/v1/login`,
            formMetadata: (id) => `${config.backendUrl}/koboApi/api/v1/formMetadata/${id}`,
            formSubmissions: (id) => `${config.backendUrl}/koboApi/api/v1/submissions/${id}`,
            downloadSubmissions: ({ id, format }) => `https://kc.kobotoolbox.org/smartland/reports/${id}/export.${format}`,
        }
    }
}
