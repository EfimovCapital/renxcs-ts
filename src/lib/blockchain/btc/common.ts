import { Networks as BNetworks, Opcode as BOpcode, Script as ZScript } from "bitcore-lib";
import { Networks as ZNetworks, Opcode as ZOpcode, Script as zScript } from "bitcore-lib-zcash";

export const createAddress =
    (networks: typeof BNetworks | typeof ZNetworks, opcode: typeof BOpcode | typeof ZOpcode, script: typeof ZScript | typeof zScript) =>
        ({ mainnet, masterPKH }: { mainnet: boolean, masterPKH: Buffer }) =>
            (address: string) =>
                new script()
                    .add(new Buffer(address.substring(0, 2) === "0x" ? address.slice(2) : address, "hex"))
                    .add(opcode.OP_DROP)
                    .add(opcode.OP_DUP)
                    .add(opcode.OP_HASH160)
                    .add(masterPKH)
                    .add(opcode.OP_EQUALVERIFY)
                    .add(opcode.OP_CHECKSIG)
                    .toScriptHashOut().toAddress(mainnet ? networks.livenet : networks.testnet).toString();
