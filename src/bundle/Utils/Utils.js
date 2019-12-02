export default {
    math() {
        return {
            round: (num) => {
                let rounded = parseFloat(Math.round(num * 100) / 100).toFixed(2)
                if (rounded > 0.00)
                    return parseFloat(rounded)
                return 0
            }
        }
    }
}
