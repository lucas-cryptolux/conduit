import { Migration } from '@mikro-orm/migrations';

export class Migration20231207230331 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `article_coauthors` (`article_id` int unsigned not null, `user_id` int unsigned not null, primary key (`article_id`, `user_id`)) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `article_coauthors` add index `article_coauthors_article_id_index`(`article_id`);');
    this.addSql('alter table `article_coauthors` add index `article_coauthors_user_id_index`(`user_id`);');

    this.addSql('alter table `article_coauthors` add constraint `article_coauthors_article_id_foreign` foreign key (`article_id`) references `article` (`id`) on update cascade on delete cascade;');
    this.addSql('alter table `article_coauthors` add constraint `article_coauthors_user_id_foreign` foreign key (`user_id`) references `user` (`id`) on update cascade on delete cascade;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists `article_coauthors`;');
  }

}
