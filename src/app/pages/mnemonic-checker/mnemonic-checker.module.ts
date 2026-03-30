import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MnemonicCheckerComponent } from './mnemonic-checker.component';

@NgModule({
    declarations: [MnemonicCheckerComponent],
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTooltipModule],
    exports: [MnemonicCheckerComponent],
})
export class MnemonicCheckerModule {}
