export default {
    math() {
        return {
            round: (num) => {
                let rounded = parseFloat(Math.round(num * 100) / 100).toFixed(2)
                if (rounded > 0.00)
                    return parseFloat(rounded)
                return 0
            },
            countValuesRepetitions: (data, val) => {
                let counts = {}
                data.forEach(function (x) {
                    counts[x[val]] = (counts[x[val]] || 0) + 1;
                })
                return counts
            }
        }
    },
    time() {
        return {
            convertToEstTime: (date) => {
                let offset = -300; //Timezone offset for EST in minutes.
                return new Date(date.getTime() + offset*60*1000);
            }
        }
    }
}
