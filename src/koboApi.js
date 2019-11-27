import config from "./config";

export default {
    urls() {
        return {
            login: `${config.backendUrl}/koboApi/api/v1/login`,
            userForms: `${config.backendUrl}/koboApi/api/v1/userForms`,
            formMetadata: (id, token) => `${config.backendUrl}/koboApi/api/v1/formMetadata/${id}?token=${token}`,
            formSubmissions: (id, token) => `${config.backendUrl}/koboApi/api/v1/submissions/${id}?token=${token}`,
            downloadSubmissions: ({ koboUser, id, format }) => `https://kc.kobotoolbox.org/${koboUser}/reports/${id}/export.${format}`,
        }
    }
}
