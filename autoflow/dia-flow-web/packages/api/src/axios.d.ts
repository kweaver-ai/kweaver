import "axios";

declare module "axios" {
  export interface AxiosRequestConfig<D> {
    allowTimestamp?: boolean;
  }
}