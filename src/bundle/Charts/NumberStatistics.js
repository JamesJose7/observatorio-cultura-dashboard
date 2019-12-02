import React from 'react'
import './NumberStatistics.css'

function NumberStatistics(props) {
    return (
        <div className="number-stats-container">
            <div>
                <span>Mínimo</span>
                <p>{props.min}</p>
            </div>
            <div>
                <span>Promedio</span>
                <p>{props.average}</p>
            </div>
            <div>
                <span>Máximo</span>
                <p>{props.max}</p>
            </div>
        </div>
    )
}

export default NumberStatistics
