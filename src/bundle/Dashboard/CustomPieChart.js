import React, { Component } from 'react'
import withSizes from 'react-sizes'
import {ResponsivePie} from "@nivo/pie";

class CustomPieChart extends Component {
    render() {
        return <div>{!this.props.isMobile ? (
            <ResponsivePie
                title
                data={this.props.data}
                margin={{ top: 30, right: 10, bottom: 30, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                colors={{ scheme: 'paired' }}
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
                        anchor: 'left',
                        direction: 'column',
                        translateX: -50,
                        itemWidth: 20,
                        itemHeight: 40,
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
        ) : (
            <ResponsivePie
                title
                data={this.props.data}
                margin={{ top: 20, right: 0, bottom: 200, left: 0 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                colors={{ scheme: 'paired' }}
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
                        anchor: 'bottom-left',
                        direction: 'column',
                        translateY: 200,
                        translateX: 15,
                        itemWidth: 20,
                        itemHeight: 40,
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
        )}</div>
    }
}

const mapSizesToProps = ({ width }) => ({
    isMobile: width < 575,
})

export default withSizes(mapSizesToProps)(CustomPieChart)
