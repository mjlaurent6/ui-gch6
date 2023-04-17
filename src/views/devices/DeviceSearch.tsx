import React, {Component} from "react";

import {Space, Card, Button, Form, Input, Row, Col, Descriptions, Select, Typography, InputNumber, Spin} from "antd";

import {Device} from "@chirpstack/chirpstack-api-grpc-web/api/device_pb";
import Map, {Marker, MarkerColor} from "../../components/Map";
import DeviceStore from "../../stores/DeviceStore";
import {
    ApiKey,
    GetDevicesSummaryRequest,
    ListApiKeysRequest, ListApiKeysResponse
} from "@chirpstack/chirpstack-api-grpc-web/api/internal_pb";
import {Link} from "react-router-dom";
import {Circle, FeatureGroup, LayerGroup, Popup} from "react-leaflet";
import {LatLngTuple, marker} from "leaflet";
import {Color} from "chart.js";
import DataTable, {GetPageCallbackFunc} from "../../components/DataTable";
import {ColumnsType} from "antd/es/table";
import DeleteConfirm from "../../components/DeleteConfirm";
import {DeleteOutlined} from "@ant-design/icons";
import InternalStore from "../../stores/InternalStore";
import {ReactComponent} from "*.svg";

export type Signal = {
    rssi: number,
    snr: number,
    tx_power: number,
}

export type RxInfo = {
    gateway_id: string,
    signal: Signal
    location: { altitude: number, latitude: number, longitude: number },
    distance: number,
}

export type DeviceSearchUpLink = {
    time: string,
    rx_info: RxInfo[]
}

export type ColorOptions = {
    color: string,
    markerColor: MarkerColor,
}

const greenOptions: ColorOptions = {color: 'green', markerColor: 'green'}
const orangeOptions: ColorOptions = {color: 'orange', markerColor: 'orange'}
const purpleOptions: ColorOptions = {color: 'purple', markerColor: 'purple'}
const redOptions: ColorOptions = {color: 'red', markerColor: 'red'}
const blueOptions: ColorOptions = {color: 'blue', markerColor: 'blue'}
const color = [greenOptions, orangeOptions, purpleOptions, redOptions, blueOptions]

interface GatewayProps {
    deviceMetrics: DeviceSearchUpLink[],
    dates: object[],
}

interface GatewayState {
    center: LatLngTuple
    selected: number,
}

class GatewayMap extends Component<GatewayProps, GatewayState> {
    constructor(props: GatewayProps) {
        super(props);
        // @ts-ignore
        const location = props.deviceMetrics.at(0).rx_info.at(0).location;
        this.state = {
            // @ts-ignore
            center: [location.latitude, location.longitude],
            selected: 0,
        };
    }

    handleChange = (index: number) => {
        this.setState({
            selected: index,
        })
    };

    renderMap = () => {
        // @ts-ignore
        const rxInfo = this.props.deviceMetrics.at(this.state.selected).rx_info;
        return (
            <Space direction="vertical" style={{width: "100%"}} size="large">
                <Row gutter={24}>
                    <Col span={24}>
                        <Card>
                            <h1>
                                Date
                            </h1>
                            <Select
                                value={this.state.selected}
                                style={{width: '100%'}}
                                onChange={this.handleChange}
                                options={this.props.dates}
                            />
                        </Card>
                    </Col>
                </Row>
                <Row gutter={24}>
                    <Col span={24}>
                        <Card>
                            <Map height={800} center={this.state.center} zoom={17}>
                                {rxInfo &&
                                    rxInfo.map(
                                        (item: RxInfo, idx: number) => {
                                            if (item.location.longitude && item.location.latitude) {
                                                const location: LatLngTuple = [item.location!.latitude, item.location!.longitude]
                                                const fill = color[idx % 5];
                                                const markerColor: MarkerColor = fill.markerColor;
                                                return <FeatureGroup pathOptions={fill} key={`gw-${idx}`}>
                                                    <Popup>{item.gateway_id}</Popup>
                                                    <Circle
                                                        center={location}
                                                        radius={item.distance}
                                                    />
                                                    <Marker position={location} faIcon="wifi" color={markerColor}/>
                                                </FeatureGroup>
                                            }
                                        }
                                    )
                                }
                            </Map>
                        </Card>
                    </Col>
                </Row>
                <Row gutter={24}>
                    {rxInfo &&
                        rxInfo.map(
                            (item: RxInfo, idx: number) => {
                                return <Col span={8} key={`gw-${idx}`}>
                                    <Card>
                                        <h1>Gateway {idx + 1}</h1>
                                        <p>Gateway ID: {item.gateway_id}</p>
                                        <p>RSSI: {item.signal.rssi}</p>
                                        <p>Est. Distance: {item.distance} m</p>
                                        {(item.location.longitude && item.location.latitude) &&
                                            <Button type='primary' onClick={() => {
                                                const location = item.location;
                                                // @ts-ignore
                                                this.setState({center: [location.latitude, location.longitude]})
                                            }}>Find</Button>
                                        }
                                        {!(item.location.longitude && item.location.latitude) &&
                                            <p>No location detected</p>
                                        }
                                    </Card>
                                </Col>
                            }
                        )
                    }

                </Row>
            </Space>
        )
    }

    render() {
        return this.renderMap();
    }
}


interface IProps {
    device: Device;
}

interface IState {
    deviceMetrics: DeviceSearchUpLink[],
    queryLimit: number,
    loading: boolean,
    dates: object[],
}

class DeviceSearch extends Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            deviceMetrics: [],
            queryLimit: 5,
            loading: false,
            dates: [],
        };
    }

    columns = (): ColumnsType<ApiKey.AsObject> => {
        return [
            {
                title: "Gateway ID",
                dataIndex: "gatewayId",
                key: "gatewayId",
            },
            {
                title: "RSSI",
                dataIndex: "rssi",
                key: "rssi",
            },
            {
                title: "SNR",
                dataIndex: "snr",
                key: "snr",
            },
            {
                title: "Estimated Distance",
                dataIndex: "distance",
                key: "distance",
            },
        ];
    };

    componentDidMount() {
        this.handleSearch()
    }

    onChange = (e: any) => {
        this.setState({
            queryLimit: Number(e.target.value),
        })
    };

    handleSearch = () => {
        this.setState({
            loading: true,
        })
        DeviceStore.getSearchLocation(
            this.props.device.getDevEui(),
            this.state.queryLimit,
            (data: DeviceSearchUpLink[]) => {
                let times: object[] = [];
                data.forEach((item, index) => {
                    times.push({
                        'value': index,
                        'label': (new Date(item.time)).toString(),
                    });
                })
                this.setState({
                    loading: false,
                    queryLimit: 5,
                    dates: times,
                    deviceMetrics: data
                })
            }
        )
    }

    renderView = () => {
        return (
            <Space direction="vertical" style={{width: "100%"}} size="large">
                <Row gutter={24}>
                    <Col span={24}>
                        <Card>
                            <h1>Query Limit [5,20]</h1>
                            <p><Input
                                defaultValue={this.state.queryLimit}
                                onChange={this.onChange}/>
                            </p>
                            <p>
                                <Button
                                    type="primary"
                                    onClick={this.handleSearch}
                                    loading={this.state.loading}
                                >
                                    Search
                                </Button>
                            </p>
                        </Card>
                    </Col>
                </Row>

                {/*// @ts-ignore*/}
                {this.state.deviceMetrics && this.state.deviceMetrics.length > 0 &&
                    <GatewayMap
                        deviceMetrics={this.state.deviceMetrics}
                        dates={this.state.dates}
                    />}
            </Space>
        );
    };

    render() {
        return this.renderView();
    }
}

export default DeviceSearch;
