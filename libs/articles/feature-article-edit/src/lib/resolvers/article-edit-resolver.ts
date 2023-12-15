import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { articleActions } from '@realworld/articles/data-access';
import { EMPTY, catchError, map, of } from 'rxjs';
import { ArticlesService } from '../../../../data-access/src/lib/services/articles.service';

export const articleEditResolver: ResolveFn<boolean> = (route: ActivatedRouteSnapshot) => {
  const slug = route.params['slug'];
  const store = inject(Store);
  const articlesService = inject(ArticlesService);
  const router = inject(Router);

  if (slug) {
    store.dispatch(articleActions.loadArticle({ slug }));

    return articlesService.startEditing(slug).pipe(
      map(() => true),
      catchError((error) => {
        alert('Article is locked');
        router.navigate([`/article/${slug}`]);
        return EMPTY;
      }),
    );
  }

  return of(true);
};
