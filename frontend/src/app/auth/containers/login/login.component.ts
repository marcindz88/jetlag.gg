import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ROUTES } from '@shared/constants/routes';
import { LoaderService } from '@shared/services/loader.service';

import { UserService } from '../../services/user.service';

@Component({
  selector: 'pg-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  form: FormGroup;
  serverError: 'lobby_full' | 'unknown_error' | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private myPlayerService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.formBuilder.group({
      nickname: [null, [Validators.required, Validators.maxLength(15), Validators.minLength(3)]],
    });
  }

  get nicknameControl() {
    return this.form.get('nickname');
  }

  registerAndStartGame() {
    if (this.form.valid) {
      this.serverError = null;
      this.myPlayerService.createUser(this.nicknameControl?.value as string).subscribe({
        next: () => {
          LoaderService.addLoader(); // start additional loader until earth finishes rendering
          void this.router.navigate([ROUTES.root, ROUTES.game]);
        },
        error: err => {
          if (err instanceof HttpErrorResponse) {
            switch (err.status) {
              case HttpStatusCode.BadRequest:
                this.nicknameControl?.setErrors({ username_taken: true });
                break;
              case HttpStatusCode.Conflict:
                this.serverError = 'lobby_full';
                break;
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
}
