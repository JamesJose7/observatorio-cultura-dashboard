import React from "react";
import * as am4core from "@amcharts/amcharts4/core";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import * as am4plugins_wordCloud from "@amcharts/amcharts4/plugins/wordCloud";

am4core.useTheme(am4themes_animated);

class WordCloudChart extends React.Component {
    componentDidMount() {
        let chart = am4core.create(this.props.id, am4plugins_wordCloud.WordCloud);

        let series = chart.series.push(new am4plugins_wordCloud.WordCloudSeries());

        series.minWordLength = 2;
        series.maxCount = 100;
        series.colors = new am4core.ColorSet();
        series.colors.passOptions = {};
        series.labels.template.tooltipText = "{word}:\n[bold]{value}[/]";
        series.excludeWords = ["de"];

        if (this.props.text)
            series.text = this.props.text;

        if (this.props.structuredData) {
            series.data = this.props.structuredData;
            series.dataFields.word = "tag";
            series.dataFields.value = "weight";
        }

        this.chart = chart;
        this.series = series;
    }

    componentWillUnmount() {
        if (this.chart) {
            this.chart.dispose();
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.text !== this.props.text) {
            this.series.text = this.props.text;
        }
        if (prevProps.structuredData !== this.props.structuredData) {
            this.series.data = this.props.structuredData;
        }
    }

    render() {
        return (
            <div id={this.props.id} style={{ width: "100%", height: "500px" }}/>
        )
    }

}

export default WordCloudChart;
