import React from 'react'
import '../../App.css'

class FormDashboard extends React.Component {
    state = {
        isLoading: true,
        data: [],
        error: null
    }

    fetchFormData() {
        var formId = 'abSepFikh7Kh6E6dwrbxAq'
        // Where we're fetching data from
        fetch('https://cors-anywhere.herokuapp.com/https://kf.kobotoolbox.org/api/v2/assets/' + formId + '/data.json', {
            headers: new Headers({
                'Authorization': 'Token 1dda84dc2ee0d5b04dcc8015bfbba66de32f080f',
                'X-Requested-With': 'application/json'
            }),
        })
        // get the API response and receive data in JSON format
            .then(response => response.json())
            // Update data state
            .then(data =>
                this.setState({
                    data: data.results,
                    isLoading: false,
                })
            )
            // Catch any errors we hit and update the app
            .catch(error => this.setState({error, isLoading: false}));
    }

    componentDidMount() {
        this.fetchFormData()
    }

    render() {
        const {isLoading, data, error} = this.state
        console.log(data)

        return(
            <div>
                <div>
                    {/*Display a message if we encounter an error*/}
                    {error ? <p>{error.message}</p> : null}

                    {/*// data check*/}
                    {!isLoading ? (
                        <div>
                            {data.map((value, index) => {
                                return (
                                    <div key={index}>
                                        <h1>{value.nombre_responsable}</h1>
                                        <p>{value.correo}</p>
                                    </div>
                                )
                            })}
                        </div>
                        // If there is a delay in data, let's let the user know it's loading
                    ) : (
                        <div className="placeholder">

                        </div>
                    )}
                </div>
            </div>
        )
    }
}

export default FormDashboard
