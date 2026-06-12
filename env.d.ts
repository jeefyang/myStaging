/// <reference types="vite/client" />



type ENV = {
    /** 开发监听端口 */
    VITE_DEV_PORT: string | number,
    /** 生产监听端口 */
    VITE_PROD_PORT: string | number;
    /** 环境变量 */
    NODE_ENV: 'development' | 'production';
};

declare namespace NodeJS {
    interface ProcessEnv extends ENV { }

}

interface ImportMetaEnv extends ENV { }