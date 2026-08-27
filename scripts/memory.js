export default class Memory {

    constructor() {

        this.data = new Uint8Array(256);
        this.devices = [];

    }

    register(device) {

        this.devices.push(device)

    }

    read(addr) {

        addr &= 0xff;

        for (const device of this.devices) {
            if (device.owns(addr)) {
                const value = device.read(addr);
                if (value !== null) return value;
            }
        }

        return this.data[addr];

    }

    write(addr, value) {

        addr &= 0xff;
        value &= 0xff;

        this.data[addr] = value;

        for (const device of this.devices) {
            if (device.owns(addr)) {
                device.write(addr, value);
                return;
            }
        }

    }

    tick() {

        for (const device of this.devices) device.tick();

    }

    reset() {

        this.data.fill(0);

        for (const d of this.devices) d.reset();

    }

}