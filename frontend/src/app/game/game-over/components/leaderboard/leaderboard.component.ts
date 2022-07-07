import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LeaderboardPlayerResult, LeaderboardResponse } from '@pg/game/game-over/models/game-over.models';
import { GameOverStore } from '@pg/game/game-over/services/game-over.store';
import { TableComponent } from '@shared/components/table/table.component';
import { combineLatest } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'pg-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['leaderboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardComponent {
  @Input() myNickname!: string;
  @ViewChild(TableComponent, { read: ElementRef }) tableComponent?: ElementRef;

  leaderboard: LeaderboardResponse | null = null;
  myBestGame: LeaderboardPlayerResult | null = null;
  isMyPlayerVisibleInTheList = false;
  allFetched = false;
  isListLoading = true;

  constructor(private cdr: ChangeDetectorRef, private gameOverStore: GameOverStore, private _elementRef: ElementRef) {
    this.getDataFromStore();
  }

  tableScrolled(element: HTMLTableElement) {
    if (this.allFetched || this.isListLoading) {
      return;
    }

    if (element.scrollHeight - element.offsetHeight - element.scrollTop < 150) {
      this.isListLoading = true;
      this.gameOverStore.getLeaderboardNextPage();
    }
  }

  private getDataFromStore() {
    combineLatest([
      this.gameOverStore.allFetched$,
      this.gameOverStore.myPlayerBestGame$,
      this.gameOverStore.leaderboard$,
      this.gameOverStore.isListLoading$,
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([allFetched, myBestGame, leaderboard, isListLoading]) => {
        this.allFetched = allFetched;
        this.myBestGame = myBestGame;
        this.leaderboard = leaderboard;
        this.isListLoading = isListLoading;

        this.isMyPlayerVisibleInTheList = this.getUpdatedIsMyPlayerVisibleInTheList();
        this.cdr.markForCheck();
      });
  }

  private getUpdatedIsMyPlayerVisibleInTheList(): boolean {
    if (!this.myBestGame || !this.leaderboard) {
      return false;
    }

    return this.myBestGame.position <= this.leaderboard.results.length - 1;
  }
}
