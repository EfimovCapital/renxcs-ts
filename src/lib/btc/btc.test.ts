import { createTestnetAddress, getTestnetUTXOs } from "./btc";

test("createAddress", () => {
    expect(createTestnetAddress("5Ea5F67cC958023F2da2ea92231d358F2a3BbA47"))
        .toBe("2N8TaSkY3cn5M2JF7tbR6UMBKjwBMtmt1aS");

    expect(createTestnetAddress("0x5Ea5F67cC958023F2da2ea92231d358F2a3BbA47"))
        .toBe("2N8TaSkY3cn5M2JF7tbR6UMBKjwBMtmt1aS");
});

test("retrieve utxos", async () => {
    const ret = await getTestnetUTXOs("2N8TaSkY3cn5M2JF7tbR6UMBKjwBMtmt1aS", 10, 0);
    expect(ret.length).toBeGreaterThan(0);
});
