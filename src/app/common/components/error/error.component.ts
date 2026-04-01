import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-error',
    template: `
        <blui-empty-state responsive style="padding: 72px 48px" [title]="title" [description]="description">
            <mat-icon blui-empty-icon>error</mat-icon>
        </blui-empty-state>
    `,
    encapsulation: ViewEncapsulation.None,
})
export class ErrorComponent {
    @Input() title = 'Error';
    @Input() description = 'Something went wrong. Please check your connection and try again.';
}
