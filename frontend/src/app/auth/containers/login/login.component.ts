import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ROUTES_URLS } from '@shared/constants/routes';

import { UserService } from '../../services/user.service';

@Component({
  selector: 'pg-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  form = this.createForm();
  serverError: 'unknown_error' | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private myPlayerService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get nicknameControl() {
    return this.form.controls.nickname;
  }

  registerAndStartGame() {
    if (this.form.valid && this.nicknameControl?.value) {
      this.serverError = null;
      this.myPlayerService.createUser(this.nicknameControl.value).subscribe({
        next: () => {
          void this.router.navigateByUrl(ROUTES_URLS.game, { replaceUrl: true });
        },
        error: err => {
          if (err instanceof HttpErrorResponse) {
            switch (err.status) {
              default:
                this.serverError = 'unknown_error';
                break;
            }
            this.cdr.markForCheck();
          }
        },
      });
    }
  }

  private createForm() {
    return this.formBuilder.group({
      nickname: [
        '',
        [Validators.required, Validators.maxLength(15), Validators.minLength(3), Validators.pattern(/([A-z]\d*|\s)*/)],
      ],
    });
  }
}
