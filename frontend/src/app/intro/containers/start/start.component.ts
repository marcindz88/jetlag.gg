import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MyPlayerService } from '../../../players/services/my-player.service';
import { Router } from '@angular/router';
import { ROUTES } from '../../../shared/constants/routes';

@Component({
  selector: 'pg-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss'],
})
export class StartComponent {
  form: FormGroup;

  constructor(private formBuilder: FormBuilder, private myPlayerService: MyPlayerService, private router: Router) {
    this.form = this.formBuilder.group({
      nickname: [null, Validators.required],
    });
  }

  registerAndStartGame() {
    if (this.form.valid) {
      this.myPlayerService.createUser(this.form.get('nickname')?.value as string).subscribe(() => {
        void this.router.navigate([ROUTES.root, ROUTES.game]);
      });
    }
  }
}
