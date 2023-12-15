import { Component, Input, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Article, User } from '@realworld/core/api-types';

@Component({
  selector: 'cdt-article-meta',
  standalone: true,
  templateUrl: './article-meta.component.html',
  styleUrls: ['./article-meta.component.css'],
  imports: [RouterModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleMetaComponent {
  @Input() article!: Article;
  @Input() isAuthenticated!: boolean;
  @Input() canModify!: boolean;
  @Input() currentUser!: User | undefined;
  @Output() follow: EventEmitter<string> = new EventEmitter<string>();
  @Output() unfollow: EventEmitter<string> = new EventEmitter<string>();
  @Output() unfavorite: EventEmitter<string> = new EventEmitter();
  @Output() favorite: EventEmitter<string> = new EventEmitter();
  @Output() delete: EventEmitter<string> = new EventEmitter();

  toggleFavorite() {
    if (this.article.favorited) {
      this.unfavorite.emit(this.article.slug);
    } else {
      this.favorite.emit(this.article.slug);
    }
  }

  toggleFollow(username: string) {
    if (this.article.author.username === username) {
      if (this.article.author.following) {
        this.unfollow.emit(username);
      } else {
        this.follow.emit(username);
      }
    } else {
      const coauthor = this.article.coauthors.find((co) => co.username === username);
      if (coauthor) {
        if (coauthor.following) {
          this.unfollow.emit(username);
        } else {
          this.follow.emit(username);
        }
      }
    }
  }

  deleteArticle() {
    this.delete.emit(this.article.slug);
  }
}
