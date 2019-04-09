import { MultiAddress } from "../types/types";
import { DarknodeGroup } from "./darknodeGroup";

const bootstrapNode0 = MultiAddress("/ip4/3.88.22.140/tcp/18514/ren/8MHnA2HRUsfBCwPCzyC2a1tGkWUvhR");
// const bootstrapNode1 = MultiAddress("/ip4/34.219.91.31/tcp/18514/ren/8MHktU1qWnDbH3zhum2A829i5QQMDg");

test.only("bootstrapping", async () => {
    // try {
    //     console.log(await (new Darknode(bootstrapNode0).getHealth()));
    // } catch (error) {
    //     console.log(error);
    // }

    const group: DarknodeGroup = await new DarknodeGroup(bootstrapNode0).bootstrap();
    expect(group.darknodes.size).toBeGreaterThan(1);
});
