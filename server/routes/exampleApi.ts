import { ExampleApiUrl } from "@common/apis/example";
import { TransExpressRouter } from "@common/apis/tools/transExpressRouter";
import { Router } from "express";

export function useExampleApi(router: Router) {
    const exampleRouter = new TransExpressRouter(ExampleApiUrl, router);

    exampleRouter.setRouter("testGet", async (from, req, res) => {
        return { data: { 'testData': `hello world ${from.text}` } };
    });

}