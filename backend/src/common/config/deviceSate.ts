class DeviceState {

    private devicesState = new Map<string, number>();

    updateDeviceState = (deviceId: string, power: number) => {
        this.devicesState.set(deviceId, power);
    }

    getDeviceState = (deviceId: string) => {
        return this.devicesState.get(deviceId);
    }

    deleteDeviceState = (deviceId: string) => {
        this.devicesState.delete(deviceId);
    }

    calculatePowerChange = (deviceId: string, power: number) => {
        const previousPower = this.getDeviceState(deviceId);
        if (previousPower === undefined) {
            return power;
        }
        return power - previousPower;
    }
}

export const deviceState = new DeviceState();
