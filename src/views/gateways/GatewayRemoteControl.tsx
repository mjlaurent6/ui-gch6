import React, {Component} from "react";

import moment from "moment";
import {Space, Card, Button, Form, Input, Row, Col} from "antd";

import {
    Gateway,
    GenerateGatewayClientCertificateRequest,
    GenerateGatewayClientCertificateResponse,
} from "@chirpstack/chirpstack-api-grpc-web/api/gateway_pb";
import GatewayStore from "../../stores/GatewayStore";
import * as mqtt from "mqtt";

const {TextArea} = Input;

interface IProps {
    gateway: Gateway;
}

interface IState {
    status: string,
    buttonDisabled: boolean,
    selected: Command | null,
    configUrl: string,
    checksum: string
}

export type Command = {
    command: string,
    label: string,
    endpoint: string
}

class GatewayRemoteControl extends Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            'status': '',
            'buttonDisabled': false,
            'selected': null,
            'configUrl': '',
            'checksum': '',
        };
    }

    pingGateway = async () => {
        this.setState({
            'buttonDisabled': true,
        })
        await GatewayStore.sendRemoteMessage(
            `gateway/control/ping?gateway_id=0x${this.props.gateway.getGatewayId()}`,
            (resp: any) => {
                this.setState({
                    'status': resp,
                    'buttonDisabled': false,
                })
            }
        );
    };

    upTimeGateway = async () => {
        this.setState({
            'buttonDisabled': true,
        })
        await GatewayStore.sendRemoteMessage(
            `gateway/control/uptime?gateway_id=0x${this.props.gateway.getGatewayId()}`,
            (resp: any) => {
                this.setState({
                    'status': resp,
                    'buttonDisabled': false,
                })
            }
        );
    };

    tempGateway = async () => {
        this.setState({
            'buttonDisabled': true,
        })
        await GatewayStore.sendRemoteMessage(
            `gateway/control/temp?gateway_id=0x${this.props.gateway.getGatewayId()}`,
            (resp: any) => {
                this.setState({
                    'status': resp,
                    'buttonDisabled': false,
                })
            }
        );
    };

    startGateway = async () => {
        const { configUrl, checksum } = this.state;
        this.setState({
            'buttonDisabled': true,
        })
        await GatewayStore.sendRemoteMessage(
            `gateway/control/start?gateway_id=0x${this.props.gateway.getGatewayId()}&config_uri=${configUrl}&checksum=${checksum}`,
            (resp: any) => {
                this.setState({
                    'status': resp,
                    'buttonDisabled': false,
                })
            }
        );
    };

    rebootGateway = async () => {
        const { configUrl, checksum } = this.state;
        this.setState({
            'buttonDisabled': true,
        })
        await GatewayStore.sendRemoteMessage(
            `gateway/control/reboot?gateway_id=0x${this.props.gateway.getGatewayId()}&config_uri=${configUrl}&checksum=${checksum}`,
            (resp: any) => {
                this.setState({
                    'status': resp,
                    'buttonDisabled': false,
                })
            }
        );
    };

    stopGateway = async () => {
        this.setState({
            'buttonDisabled': true,
        })
        await GatewayStore.sendRemoteMessage(
            `gateway/control/stop?gateway_id=0x${this.props.gateway.getGatewayId()}`,
            (resp: any) => {
                this.setState({
                    'status': resp,
                    'buttonDisabled': false,
                })
            }
        );
    };

    renderView = () => {
        const commands: Command[] = [
            {'command': 'ping', 'label': 'Ping', 'endpoint': 'gateway/control/ping'},
            {'command': 'uptime', 'label': 'Uptime', 'endpoint': 'gateway/control/uptime'},
        ]
        return (
            <Space direction="vertical" style={{width: "100%"}} size="large">
                <Row gutter={24}>
                    <Col span={8}>
                        <Card>
                            <h3>Ping</h3>
                            <Button
                                onClick={this.pingGateway}
                                disabled={this.state.buttonDisabled}
                                loading={this.state.buttonDisabled}
                            >
                                Send
                            </Button>
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <h3>Uptime</h3>
                            <Button
                                onClick={this.upTimeGateway}
                                disabled={this.state.buttonDisabled}
                                loading={this.state.buttonDisabled}
                            >
                                Get
                            </Button>
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card>
                            <h3>Temperature</h3>
                            <Button
                                onClick={this.tempGateway}
                                disabled={this.state.buttonDisabled}
                                loading={this.state.buttonDisabled}
                            >
                                Get
                            </Button>
                        </Card>
                    </Col>
                </Row>
                <Row gutter={24}>
                    <Col span={9}>
                        <Card>
                            <Space direction='vertical'>
                                <h3>Start</h3>
                                <Input
                                    addonBefore="configUrl: "
                                    onChange={(e) => {
                                        this.setState({'configUrl': e.target.value})
                                    }}
                                />
                                <Input
                                    addonBefore="MD5: "
                                    onChange={(e) => {
                                        this.setState({'checksum': e.target.value})
                                    }}
                                />
                                <Button
                                    onClick={this.startGateway}
                                    disabled={this.state.buttonDisabled}
                                    loading={this.state.buttonDisabled}
                                >
                                    Send
                                </Button>
                            </Space>
                        </Card>
                    </Col>
                    <Col span={9}>
                        <Card>
                            <Space direction='vertical'>
                                <h3>Reboot</h3>
                                <Input
                                    addonBefore="configUrl: "
                                    onChange={(e) => {
                                        this.setState({'configUrl': e.target.value})
                                    }}
                                />
                                <Input
                                    addonBefore="MD5: "
                                    onChange={(e) => {
                                        this.setState({'checksum': e.target.value})
                                    }}
                                />
                                <Button
                                    onClick={this.rebootGateway}
                                    disabled={this.state.buttonDisabled}
                                    loading={this.state.buttonDisabled}
                                >
                                    Send
                                </Button>
                            </Space>
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Space direction='vertical'>
                                <h3>Stop</h3>
                                <Button
                                    onClick={this.stopGateway}
                                    disabled={this.state.buttonDisabled}
                                    loading={this.state.buttonDisabled}
                                >
                                    Send
                                </Button>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={24}>
                        <p>Logs: </p>
                        <TextArea rows={9} maxLength={6} disabled value={this.state.status}/>
                    </Col>
                </Row>
            </Space>
        );
    };

    render() {
        return this.renderView();
    }
}

export default GatewayRemoteControl;
