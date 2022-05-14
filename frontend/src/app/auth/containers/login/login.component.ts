import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ROUTES } from '@shared/constants/routes';

import { UserService } from '../../services/user.service';

@Component({
  selector: 'pg-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private myPlayerService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.formBuilder.group({
      nickname: [null, Validators.required],
    });
  }

  get nicknameControl() {
    return this.form.get('nickname');
  }

  registerAndStartGame() {
    if (this.form.valid) {
      this.myPlayerService.createUser(this.nicknameControl?.value as string).subscribe({
        next: () => {
          void this.router.navigate([ROUTES.root, ROUTES.game]);
        },
        error: err => {
          if (err instanceof HttpErrorResponse && err.status === HttpStatusCode.BadRequest) {
            this.nicknameControl?.setErrors({ username_taken: true });
            this.cdr.markForCheck();
          }
        },
      });
    }
  }
}
