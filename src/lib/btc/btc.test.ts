import { createTestnetAddress } from "./btc";

test("createAddress", () => {
    const x = createTestnetAddress("5Ea5F67cC958023F2da2ea92231d358F2a3BbA47");
    expect(x).toBe("2N8TaSkY3cn5M2JF7tbR6UMBKjwBMtmt1aS");
});
