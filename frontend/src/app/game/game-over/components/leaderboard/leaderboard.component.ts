import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { LeaderboardPlayerResult, LeaderboardResponse } from '@pg/game/game-over/models/game-over.models';
import { GameOverStore } from '@pg/game/game-over/services/game-over.store';

@Component({
  selector: 'pg-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['leaderboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardComponent implements OnChanges {
  @Input() myNickname!: string;
  @Input() leaderboard: LeaderboardResponse | null = null;
  @Input() myBestGameResult: LeaderboardPlayerResult | null = null;
  @Input() allFetched = false;
  @Input() isListLoading = true;

  isMyPlayerVisibleInTheList = false;

  constructor(private gameOverStore: GameOverStore) {}

  ngOnChanges(): void {
    this.isMyPlayerVisibleInTheList = this.getUpdatedIsMyPlayerVisibleInTheList();
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

  private getUpdatedIsMyPlayerVisibleInTheList(): boolean {
    if (!this.myBestGameResult || !this.leaderboard) {
      return false;
    }

    return this.myBestGameResult.position <= this.leaderboard.results.length - 1;
  }
}
