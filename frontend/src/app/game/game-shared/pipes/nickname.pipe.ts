import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'nickname' })
export class NicknamePipe implements PipeTransform {
  transform(nickname: string): string {
    return nickname.replace(':1', '').replace(':', ' #');
  }
}
