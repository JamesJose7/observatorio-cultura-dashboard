export default {
    urls() {
        return {
            login: 'http://localhost:8080/koboApi/api/v1/login',
            formMetadata: (id) => `http://localhost:8080/koboApi/api/v1/formMetadata/${id}`,
            formSubmissions: (id) => `http://localhost:8080/koboApi/api/v1/submissions/${id}`,
            downloadSubmissions: ({ id, format }) => `https://kc.kobotoolbox.org/smartland/reports/${id}/export.${format}`,
        }
    }
}
