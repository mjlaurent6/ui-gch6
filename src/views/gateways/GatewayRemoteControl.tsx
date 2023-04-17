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
}

class GatewayRemoteControl extends Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            'status': '',
            'buttonDisabled': false,
        };
    }

    pushMessage = async () => {
        this.setState({
            'buttonDisabled': true,
        })
        await GatewayStore.sendRemoteMessage(
            `${this.props.gateway.getGatewayId()}/restart`,
            (resp: any) => {
                this.setState({
                    'status': resp,
                    'buttonDisabled': false,
                })
            }
        );
    };

    renderView = () => {
        return (
            <Space direction="vertical" style={{width: "100%"}} size="large">
                <Row gutter={24}>
                    <Col span={6}>
                        <Card>
                            <h3>Health Check</h3>
                            <Button
                                onClick={this.pushMessage}
                                disabled={this.state.buttonDisabled}
                            >
                                Health Check
                            </Button>
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <h3>
                                Restart Gateway
                            </h3>
                            <Button onClick={this.pushMessage}>
                                Restart Gateway
                            </Button>
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <h3>
                                Ping Gateway
                            </h3>
                            <Button onClick={this.pushMessage}>
                                Ping Gateway
                            </Button>
                        </Card>
                    </Col>
                </Row>
                <Row gutter={24}>
                    <Col span={24}>
                        <TextArea rows={4} maxLength={6} disabled value={this.state.status}/>
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
