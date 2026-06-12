import { apiUrlsTrans } from "./tools/apiUrlsTrans";

export const ExampleApiUrl = apiUrlsTrans("test/", {
    testPost: { method: "POST", from: {} as { text: string; }, to: {} as { testData: string; } },
    testGet: { method: "POST", from: {} as { text: string; }, to: {} as { testData: string; } },
    testFrom: { method: "POST", from: {} as { text: string; } },
    testTo: { method: "POST", to: {} as { data: string; } }
});