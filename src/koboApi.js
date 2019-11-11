export default {
    urls() {
        return {
            formMetadata: (id) => `https://kf.kobotoolbox.org/api/v2/assets/${id}/?format=json`,
            formSubmissions: (id) => `https://kf.kobotoolbox.org/api/v2/assets/${id}/data.json`,
            downloadSubmissions: ({ id, format }) => `https://kc.kobotoolbox.org/jeeguiguren/reports/${id}/export.${format}`,
        }
    }
}
