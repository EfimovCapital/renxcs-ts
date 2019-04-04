import { Networks, Opcode, Script } from "bitcore-lib";

export const testnetMasterPKH = new Buffer("e02cabac3a62655335b1227dfdecfff27b5f6111", "hex");

export const createAddress = ({ mainnet, masterPKH }: { mainnet: boolean, masterPKH: Buffer }) =>
    (address: string) =>
        new Script()
            .add(new Buffer(address.substring(0, 2) === "0x" ? address.slice(2) : address, "hex"))
            .add(Opcode.OP_DROP)
            .add(Opcode.OP_DUP)
            .add(Opcode.OP_HASH160)
            .add(masterPKH)
            .add(Opcode.OP_EQUALVERIFY)
            .add(Opcode.OP_CHECKSIG)
            .toScriptHashOut().toAddress(mainnet ? Networks.livenet : Networks.testnet).toString();

export const createTestnetAddress = createAddress({ mainnet: false, masterPKH: testnetMasterPKH });
