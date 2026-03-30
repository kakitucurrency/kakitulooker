import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaperWalletComponent } from './paper-wallet.component';

@NgModule({
    declarations: [PaperWalletComponent],
    imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    exports: [PaperWalletComponent],
})
export class PaperWalletModule {}
