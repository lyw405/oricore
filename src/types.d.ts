declare module 'degit' {
  interface DegitOptions {
    force?: boolean;
    cache?: boolean;
    verbose?: boolean;
    'proxy-config'?: string;
  }

  class Degit {
    constructor(src: string, opts?: DegitOptions);
    on(event: string, handler: (...args: any[]) => void): void;
    clone(dest: string): Promise<void>;
  }

  function degit(src: string, opts?: DegitOptions): Degit;

  export default degit;
}
