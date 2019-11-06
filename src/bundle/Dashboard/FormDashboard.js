import React from 'react'
import '../../App.css'
import config from '../../config'
import {ResponsivePie} from '@nivo/pie';
import lodash from 'lodash'

class FormDashboard extends React.Component {
    state = {
        isLoading: true,
        data: [],
        error: null
    }

    fetchFormData() {
        let formId = 'abSepFikh7Kh6E6dwrbxAq'
        const url = `https://cors-anywhere.herokuapp.com/https://kf.kobotoolbox.org/api/v2/assets/${ formId }/data.json`

        fetch(url, {
            headers: new Headers({
                'Authorization': config.koboToken,
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
                }, () => this.getData())
            )
            // Catch any errors we hit and update the app
            .catch(error => this.setState({error, isLoading: false}));
    }

    getData = arg => {
        // json response data
        const submissions = this.state.data

        // Dashboard values
        let avgAsistentes = 0
        let avgAforoEspacio = 0
        let horaEventoFiltered = []
        let esParteFiavFiltered = []
        let categoriaEventoFiltered = []
        let costoEntradaFiltered = []
        let valorEntradaFiltered = []
        let minValorEntrada
        let maxValorEntrada
        let avgValorEntrada
        submissions.forEach(submission => {
            // AVG asistentes
            avgAsistentes += parseInt(submission.numero_asistentes)
            // AVG aforo espacio
            avgAforoEspacio += parseInt(submission.aforo_del_espacio)
            // AVG valor entrada
            avgValorEntrada += parseInt(submission.costo)
            // Accumulate Valor entrada
            valorEntradaFiltered.push(submission.costo)
            // Hora evento
            horaEventoFiltered.push(lodash.pick(submission, ['hora']))
            // Parte del FIAV
            esParteFiavFiltered.push(lodash.pick(submission, ['parte_del_fiav']))
            // Categoria evento
            categoriaEventoFiltered.push(lodash.pick(submission, ['categoria']))
            // Costo de entrada
            costoEntradaFiltered.push(lodash.pick(submission, ['tipo_entrada']))
        })
        // Calculate avg asistentes
        avgAsistentes /= submissions.length
        // Calculate avg aforo
        avgAforoEspacio /= submissions.length
        // Calculate valor entrada values
        valorEntradaFiltered = lodash.compact(valorEntradaFiltered)
        avgValorEntrada = (valorEntradaFiltered.reduce(function(a, b) { return a + b; })) / valorEntradaFiltered.length;
        minValorEntrada = Math.min(...valorEntradaFiltered)
        maxValorEntrada = Math.max(...valorEntradaFiltered)
        // count properties repetitions
        let hourCounts = {}
        this.countValuesRepetitions(horaEventoFiltered, hourCounts, 'hora');
        let parteFiavCounts = {}
        this.countValuesRepetitions(esParteFiavFiltered, parteFiavCounts, 'parte_del_fiav');
        let categoriaEventoCounts = {}
        this.countValuesRepetitions(categoriaEventoFiltered, categoriaEventoCounts, 'categoria');
        let costoEntradaCount = {}
        this.countValuesRepetitions(costoEntradaFiltered, costoEntradaCount, 'tipo_entrada');
        // build pie graph data
        let dataHoraEvento = [
            {
                "id": "Tarde",
                "label": "Tarde",
                "value": this.getNumValue(hourCounts.tarde),
            },
            {
                "id": "Noche",
                "label": "Noche",
                "value": this.getNumValue(hourCounts.noche),
            },
            {
                "id": "Mañana",
                "label": "Mañana",
                "value": this.getNumValue(hourCounts.ma_ana),
            }
        ]
        let dataEsParteFiav = [
            {
                "id": "Si",
                "label": "Si",
                "value": this.getNumValue(parteFiavCounts.si),
            },
            {
                "id": "No",
                "label": "No",
                "value": this.getNumValue(parteFiavCounts.no),
            }
        ]
        let dataCategoriaEvento = [
            {
                "id": "Producción propia",
                "label": "Producción propia",
                "value": this.getNumValue(categoriaEventoCounts.produccion_pro),
            },
            {
                "id": "Co producción",
                "label": "Co producción",
                "value": this.getNumValue(categoriaEventoCounts.co_produccion),
            },
            {
                "id": "Alquiler",
                "label": "Alquiler",
                "value": this.getNumValue(categoriaEventoCounts.alquiler),
            }
        ]
        let dataCostoEvento = [
            {
                "id": "Gratuito",
                "label": "Gratuito",
                "value": this.getNumValue(costoEntradaCount.gratuito),
            },
            {
                "id": "Pagado",
                "label": "Pagado",
                "value": this.getNumValue(costoEntradaCount.pagado),
            }
        ]

        // setting state
        this.setState({
            avgAsistentes: avgAsistentes,
            avgAforoEspacio: avgAforoEspacio,
            horaEvento: dataHoraEvento,
            esParteDelFiav: dataEsParteFiav,
            categoriaEvento: dataCategoriaEvento,
            costoEvento: dataCostoEvento,
            minValorEntrada: minValorEntrada,
            maxValorEntrada: maxValorEntrada,
            avgValorEntrada: avgValorEntrada
        })
    }

    countValuesRepetitions(data, countArray, val) {
        data.forEach(function (x) {
            countArray[x[val]] = (countArray[x[val]] || 0) + 1;
        })
    }

    getNumValue(val) {
        return val == null ? 0 : val;
    }

    updateDashboard = event => {
        this.getData(event.value)
    }

    componentDidMount() {
        this.fetchFormData()
    }

    render() {
        const {isLoading, data, error} = this.state

        function round(num) {
            return parseFloat(Math.round(num * 100) / 100).toFixed(2);
        }

        return (
            <div>
                <div>
                    {/*Display a message if we encounter an error*/}
                    {error ? <p>{error.message}</p> : null}

                    {/*// data check*/}
                    {!isLoading ? (
                        <div className="container-fluid">

                            {/*// <!-- kpi section -->*/}
                            <div className="row">
                                <div className="col-lg-3 col-sm-6">
                                    <div className="card">
                                        <div className="card-heading">
                                            <div>
                                                Promedio de asistentes
                                            </div>
                                        </div>
                                        <div className="card-value">
                                            { round(this.state.avgAsistentes) }
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-3 col-sm-6">
                                    <div className="card">
                                        <div className="card-heading">
                                            <div>
                                                Promedio de aforo de espacio
                                            </div>
                                        </div>
                                        <div className="card-value">
                                            { round(this.state.avgAforoEspacio) }
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-3 col-sm-6">
                                    <div className="card">
                                        <div className="card-heading">
                                            <div>
                                                Tipo de entrada
                                            </div>
                                        </div>
                                        <div className="card-value">
                                            <div className="chart-container">
                                                {/*// <!-- chart -->*/}
                                                <div style={{height: "200px"}}>
                                                    <ResponsivePie
                                                        data={this.state.costoEvento}
                                                        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                                                        innerRadius={0.5}
                                                        padAngle={0.7}
                                                        cornerRadius={3}
                                                        colors={{ scheme: 'category10' }}
                                                        borderWidth={1}
                                                        borderColor={{ from: 'color', modifiers: [ [ 'darker', 0.2 ] ] }}
                                                        enableRadialLabels={false}
                                                        slicesLabelsSkipAngle={10}
                                                        slicesLabelsTextColor="#333333"
                                                        animate={true}
                                                        motionStiffness={90}
                                                        motionDamping={15}
                                                        legends={[
                                                            {
                                                                anchor: 'bottom',
                                                                direction: 'row',
                                                                translateY: 56,
                                                                itemWidth: 60,
                                                                itemHeight: 18,
                                                                itemTextColor: '#999',
                                                                symbolSize: 18,
                                                                symbolShape: 'circle',
                                                                effects: [
                                                                    {
                                                                        on: 'hover',
                                                                        style: {
                                                                            itemTextColor: '#000'
                                                                        }
                                                                    }
                                                                ]
                                                            }
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-3 col-sm-6">
                                    <div className="card">
                                        <div className="card-heading">
                                            <div>
                                                Valor de entrada
                                            </div>
                                        </div>
                                        <div className="card-value">
                                            <span>Min</span>
                                            { this.state.minValorEntrada }
                                            <br/><span>Max</span>
                                            { this.state.maxValorEntrada }
                                            <br/><span>Promedio</span>
                                            { round(this.state.avgValorEntrada) }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="row">
                                            {/*// <!-- row to include all mini-charts -->*/}
                                            <div className="col-sm-4">
                                                <div className="chart-container">
                                                    {/*// <!-- chart -->*/}
                                                    <h3>Hora del evento</h3>
                                                    <div style={{height: "300px"}}>
                                                        <ResponsivePie
                                                            data={this.state.horaEvento}
                                                            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                                                            innerRadius={0.5}
                                                            padAngle={0.7}
                                                            cornerRadius={3}
                                                            colors={{ scheme: 'category10' }}
                                                            borderWidth={1}
                                                            borderColor={{ from: 'color', modifiers: [ [ 'darker', 0.2 ] ] }}
                                                            enableRadialLabels={false}
                                                            slicesLabelsSkipAngle={10}
                                                            slicesLabelsTextColor="#333333"
                                                            animate={true}
                                                            motionStiffness={90}
                                                            motionDamping={15}
                                                            legends={[
                                                                {
                                                                    anchor: 'bottom',
                                                                    direction: 'row',
                                                                    translateY: 56,
                                                                    itemWidth: 60,
                                                                    itemHeight: 18,
                                                                    itemTextColor: '#999',
                                                                    symbolSize: 18,
                                                                    symbolShape: 'circle',
                                                                    effects: [
                                                                        {
                                                                            on: 'hover',
                                                                            style: {
                                                                                itemTextColor: '#000'
                                                                            }
                                                                        }
                                                                    ]
                                                                }
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="chart-container">
                                                    {/*// <!-- chart -->*/}
                                                    <h3>Es parte del FIAV?</h3>
                                                    <div style={{height: "300px"}}>
                                                        <ResponsivePie
                                                            data={this.state.esParteDelFiav}
                                                            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                                                            innerRadius={0.5}
                                                            padAngle={0.7}
                                                            cornerRadius={3}
                                                            colors={{ scheme: 'category10' }}
                                                            borderWidth={1}
                                                            borderColor={{ from: 'color', modifiers: [ [ 'darker', 0.2 ] ] }}
                                                            enableRadialLabels={false}
                                                            slicesLabelsSkipAngle={10}
                                                            slicesLabelsTextColor="#333333"
                                                            animate={true}
                                                            motionStiffness={90}
                                                            motionDamping={15}
                                                            legends={[
                                                                {
                                                                    anchor: 'bottom',
                                                                    direction: 'row',
                                                                    translateY: 56,
                                                                    itemWidth: 60,
                                                                    itemHeight: 18,
                                                                    itemTextColor: '#999',
                                                                    symbolSize: 18,
                                                                    symbolShape: 'circle',
                                                                    effects: [
                                                                        {
                                                                            on: 'hover',
                                                                            style: {
                                                                                itemTextColor: '#000'
                                                                            }
                                                                        }
                                                                    ]
                                                                }
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-sm-4">
                                                <div className="chart-container">
                                                    {/*// <!-- chart -->*/}
                                                    <h3>Categoría del evento</h3>
                                                    <div style={{height: "300px"}}>
                                                        <ResponsivePie
                                                            data={this.state.categoriaEvento}
                                                            margin={{ top: 10, right: 55, bottom: 55, left: 55 }}
                                                            innerRadius={0.5}
                                                            padAngle={0.7}
                                                            cornerRadius={3}
                                                            colors={{ scheme: 'category10' }}
                                                            borderWidth={1}
                                                            borderColor={{ from: 'color', modifiers: [ [ 'darker', 0.2 ] ] }}
                                                            enableRadialLabels={false}
                                                            slicesLabelsSkipAngle={10}
                                                            slicesLabelsTextColor="#333333"
                                                            animate={true}
                                                            motionStiffness={90}
                                                            motionDamping={15}
                                                            legends={[
                                                                {
                                                                    anchor: 'bottom',
                                                                    direction: 'row',
                                                                    translateY: 30,
                                                                    itemWidth: 85,
                                                                    itemHeight: 18,
                                                                    itemTextColor: '#999',
                                                                    itemDirection: 'top-to-bottom',
                                                                    symbolSize: 18,
                                                                    symbolShape: 'circle',
                                                                    effects: [
                                                                        {
                                                                            on: 'hover',
                                                                            style: {
                                                                                itemTextColor: '#000'
                                                                            }
                                                                        }
                                                                    ]
                                                                }
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        // If there is a delay in data, let's let the user know it's loading
                    ) : (
                        <div className="placeholder">
                            <h1 className="align-content-center align-items-center">Loading...</h1>
                        </div>
                    )}
                </div>
            </div>
        )
    }
}

export default FormDashboard
