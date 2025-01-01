// web-assembly-loader.service.ts
// https://dev.to/railsstudent/angular-on-steroids-elevating-performance-with-webassembly-43gb

import { Injectable } from '@angular/core';
import { Imports, instantiate, instantiateStreaming } from '@assemblyscript/loader';

const DEFAULT_IMPORTS: Imports = { 
  env: {
    abort: function() {
      throw new Error('Abort called from wasm file');
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class WebAssemblyLoaderService {
  
  private resolveInstance: (value: any) => void = ()=>{}
  private instancePromise = new Promise<any>((resove) => {
    this.resolveInstance = resove
  })
  
  async streamWasm(wasm: string, imports = DEFAULT_IMPORTS): Promise<any> {
    if (!instantiateStreaming) {
      return this.wasmFallback(wasm, imports);
    }

    const instance = await instantiateStreaming(fetch(wasm), imports);
    return instance?.exports;
  }

  async wasmFallback(wasm: string, imports: Imports) {
    const response = await fetch(wasm);
    const bytes = await response?.arrayBuffer();
    const { instance } = await instantiate(bytes, imports);

    return instance?.exports;
  }
  
  set instance(instance) {
    this.resolveInstance(instance)
  }
  
  get instance() {
    return this.instancePromise
  }
}