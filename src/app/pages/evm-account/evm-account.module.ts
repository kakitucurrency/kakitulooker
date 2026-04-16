import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AppCommonModule } from '@app/common/app-common.module';
import { EvmAccountComponent } from './evm-account.component';

@NgModule({
    declarations: [EvmAccountComponent],
    imports: [
        AppCommonModule,
        CommonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    exports: [EvmAccountComponent],
})
export class EvmAccountModule {}
