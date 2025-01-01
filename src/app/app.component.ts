import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WebAssemblyLoaderService } from './web-assembly-loader.service';
import { APP_BASE_HREF } from '@angular/common';
import { __AdaptedExports } from '../../public/wasm/release';


const getFullPath = (assetName: string) => {
  const baseHref = inject(APP_BASE_HREF);
  const isEndWithSlash = baseHref.endsWith('/');
  return `${baseHref}${isEndWithSlash ? '' : '/'}wasm/${assetName}`;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'twilight';
  instance!: any;
  releaseWasm = getFullPath('release.wasm');
  wasmLoader = inject(WebAssemblyLoaderService);
  
  private webAssemblyLoaderService: WebAssemblyLoaderService
  
  constructor(webAssemblyLoaderService: WebAssemblyLoaderService) {
    this.webAssemblyLoaderService = webAssemblyLoaderService
  }

  async ngOnInit(): Promise<void> {
    this.instance = await this.wasmLoader.streamWasm(this.releaseWasm);
    this.webAssemblyLoaderService.instance = this.instance;
  }
}
